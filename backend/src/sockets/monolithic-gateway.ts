import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SocketAuthMiddleWare } from './middlewares/jwt-auth-middleware';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LatLng, RideWithAddresses } from 'src/types/location.type';
import { calculateDistances } from './Utils';
import { SocketDoubleConnectionMiddleWare } from './middlewares/double-connection-middleware';
import { RidesService } from 'src/rides/rides.service';
import { CancellationReason } from 'src/rides/entities/CancellationReason.enum';
import { OneSignalStaticClass } from 'src/OneSignalStaticClass';
import { PushNotification } from 'src/types/notifications.type';

interface SocketUser {
  socketId: string,
  apiId: string,
  username: string,
  notificationSubId: string,
}

export type activeRideType = {
  issuer: SocketUser,
  ride: RideWithAddresses;
  alreadyRequesteds: string[];
  currentRequested: string | undefined;
  taxi: SocketUser | undefined;
  arrived: boolean;
  rideId: string | undefined;
  requestRidePushNotification: string | undefined,
};

type taxiLocationType = {
  location: LatLng;
  lastUpdate: Date;
};

type reviewConnectionsType = {
  socketId: string,
  role: 'user' | 'taxi',
  notificationSubId: string,
}

// On ubuntu the port should be higher than 1024 or the user who runs the app must be root priviliged
@UseGuards(JwtAuthGuard)
@WebSocketGateway({
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 120 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // connections will have all the direct connections to this node, either if they are from users or taxis.
  public static connections: Map<string, SocketUser> = new Map<string, SocketUser>();
  private activeRides: Map<string, activeRideType> = new Map<string, activeRideType>();
  private taxisLocation: Map<string, taxiLocationType> = new Map<string, taxiLocationType>();
  private frequencyToCheckLastUpdate = 10;
  private taxisAvailable: Map<string, string> = new Map<string, string>();
  private beingRequested: Map<string, SocketUser> = new Map<string, SocketUser>();

  private reviewConnections: Map<string, reviewConnectionsType> = new Map<string, reviewConnectionsType>();
  
  constructor(private readonly ridesService: RidesService) {}

  @WebSocketServer()
  server: Server;

  /**
   * @requires -Important: Its necesary to trigger sync-node-ends redis event whenever exists just one node because it's never
   *  going to unsubscribe to sync-node-ends event and neither subscribe to request-sync-node.
   * @todo Check how it works when in an active ride the taxi or either the user disconnect from this server node
   *  and reconnect to another one.
   * @param client
   */
  afterInit(client: Socket) {
    client.use(SocketAuthMiddleWare() as any);
    client.use(SocketDoubleConnectionMiddleWare() as any);
  }

  /**
   * @todo Handle when a user reconnects and already has an active ride.
   * @todo Handle when a user cancels a ride in the front
   * @param client
   */
  handleConnection(client: Socket) {
    const apiId: string = client.data.apiId;

    if (!client.recovered) {
      // Handle reconnection
      if (client.data.reconnectionCheck) {
        for (const [userApiId, activeRide] of this.activeRides) {
          // If exists an active ride with the user api id equals to current connection id.
          if (apiId == userApiId) {
            let taxiName = activeRide.taxi ? activeRide.taxi.username : null;
            this.server.to(client.id).emit('reconnect-after-reconnection-check', 'user', activeRide.ride, activeRide.arrived, taxiName, ''); // Don't send taxi id on porpouse, because in the front its not used.
            break;
          }
          // If exists an active ride with the taxi api id equals to current connection id.
          if (apiId == activeRide.taxi?.username) {
            this.server.to(client.id).emit('reconnect-after-reconnection-check', 'taxi', activeRide.ride, activeRide.arrived, activeRide.issuer.username, userApiId);
            break;
          }
        }
        // If execution reach this point it means the client doesnt have to recconect, so close the connection until necessary.
        client.disconnect();
        return;
      }
    }

    MainGateway.connections.set(apiId, {
      socketId: client.id,
      apiId: apiId,
      username: client.data.username,
      notificationSubId: client.data.notificationSubId,
    }); // Example: ['2', { socketId: 'SGS345rGDS$w', username: 'Juan Ramirez' }]

    if (client.data.isReviewer) {
      this.reviewConnections.set(apiId, {
        socketId: client.id,
        role: client.data.role,
        notificationSubId: client.data.notificationSubId,
      });
    }

    if (client.data.role == 'taxi') {
      let hasAnActiveRide = false;
      for (const [userApiId, activeRide] of this.activeRides) {
        if (activeRide.taxi?.apiId == apiId) {
          hasAnActiveRide = true;
          break;
        }
      }

      if (!hasAnActiveRide) {
        this.onNewTaxiAvailable(apiId, client.id, client.data.location);
      }
    }
  }

  /**
   * @todo Handle an user disconnection in middle of a activeRide.
   * @description Remove the ids from the maps and Unsubscribes from the redis events which was Subscribed.
   * @param client
   */
  async handleDisconnect(client: Socket) {
    let apiId: string | undefined;
    for (const entry of MainGateway.connections.entries()) {
      if (entry[1].socketId == client.id) apiId = entry[0];
    }
    if (apiId === undefined) {
      console.log(`Cant find apiId in MainGateway.connections: ${client.data.apiId}.`);
      return;
    }

    if (client.data.role == 'user') {
      const activeRide = this.activeRides.get(apiId);
      // If ride exists and taxi hasn't arrived yet.
      if (activeRide != undefined && !activeRide.arrived) {
        // If the ride emitted was accepted
        if (activeRide.taxi != undefined) this.server.to(activeRide.taxi.socketId).emit('user-disconnect', activeRide.rideId);
        // Else, if the ride emitted hasn't been accepted yet
        else {
          // If exists a taxi who's being requested
          if (activeRide.currentRequested != undefined) {
            const taxiConnection = MainGateway.connections.get(activeRide.currentRequested);
            this.beingRequested.delete(activeRide.currentRequested);
            if (taxiConnection) {
              const notification: PushNotification = {
                recipients: {subscription_ids: [client.data.notificationSubId]},
                title: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username}handleDisconnect cancelled the ride`},
                content: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
                android_channel: 'Ride state',
              }
          
              await OneSignalStaticClass.createPushNotification(notification);
              this.server.to(taxiConnection.socketId).emit('user-cancel-ride');
            }
          }
          this.activeRides.delete(apiId);
        }
      }
    }

    MainGateway.connections.delete(apiId);

    if (client.data.isReviewer) this.reviewConnections.delete(apiId);

    if (client.data.role == 'taxi') {
      
      const issuer = this.beingRequested.get(apiId);
      if (issuer) this.handleRideResponse(false, apiId, client.data.username, issuer.apiId);
      
      else if (!this.taxisAvailable.has(apiId)) { // If it doesn't exists in taxisAvailable and also doesn't exists in beingRequested, it means that it has an activeRide.
        for (const [userApiId, activeRide] of this.activeRides) {
          if (activeRide.taxi?.apiId === apiId) {
            this.server.to(activeRide.issuer.socketId).emit('taxi-disconnect');
            break;
          }
        }
      }
      
      this.taxisAvailable.delete(apiId);
      this.taxisLocation.delete(apiId);
    }
  }

  // ---------------------------------------------------- Taxi Server-Side Only Functions -----------------------------------------------

  onNewTaxiAvailable(taxiApiId: string, taxiSocketId: string, location: LatLng) {
    this.taxisAvailable.set(taxiApiId, taxiSocketId);
    this.taxisLocation.set(taxiApiId, {
      location: location,
      lastUpdate: new Date(),
    });
  }

  updateRideId(userApiId: string, taxiApiId: string, rideId: string) {
    const taxiConnection = MainGateway.connections.get(taxiApiId);
    if (taxiConnection === undefined) throw new Error('Taxi socket id doesnt exists.');
    this.server.to(taxiConnection.socketId).emit('update-ride-id', rideId);
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide === undefined) throw new Error('Active ride undefined.');
    activeRide.rideId = rideId;
  }

  // ---------------------------------------------------- Handling Taxis Events ----------------------------------------------------

  @SubscribeMessage('taxi-reconnect')
  taxiReconnect(@ConnectedSocket() client: Socket) {
    for (let [userId, activeRide] of this.activeRides) {

      if (activeRide.taxi && activeRide.taxi === client.data.apiId) {
        this.server.to(activeRide.issuer.socketId).emit('taxi-reconnect');
        break;
      }

    }
  }


  @SubscribeMessage('location-updated-to-be-available')
  locationUpdatedToBeAvailable(@MessageBody() data: { location: LatLng }, @ConnectedSocket() client: Socket) {
    const { location } = data;
    this.server.to(client.id).emit('location-updated-to-be-available-received');
    this.onNewTaxiAvailable(client.data.apiId, client.id, location);
  }

  @SubscribeMessage('location-update-for-user')
  locationUpdateForUser(@MessageBody() data: { username: string, location: LatLng; userApiId: string }) {
    const { username, location, userApiId } = data;
    const activeRide = this.activeRides.get(userApiId);
    
    if (!activeRide) {
      console.log('On location-update-for-user event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    this.server.to(activeRide.issuer.socketId).emit('location-update-from-taxi', username, location);
  }

  @SubscribeMessage('ride-response')
  rideResponse(@MessageBody() data: { accepted: boolean, userApiId: string }, @ConnectedSocket() client: Socket) {
    const { accepted, userApiId } = data;
    const taxiApiId = client.data.apiId;
    const taxiUsername = client.data.username;
    const activeRide = this.activeRides.get(userApiId);
    if (!activeRide) {
      console.log(`On ride-response event, this.activeRides.get(userApiId) returned undefined.`);
      return;
    }

    this.handleRideResponse(accepted, taxiApiId, taxiUsername, userApiId);
  }

  @SubscribeMessage('taxi-arrived')
  async taxiArrived(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    let activeRide = this.activeRides.get(userApiId);

    if (!activeRide) {
      console.log('On taxi-arrived event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    if (!activeRide.rideId) {
      console.log('On taxi-arrived event, ride.rideId returned undefined.');
      return;
    }
    
    this.ridesService.update(activeRide.rideId, {arrivedTimestamp: new Date()});
    activeRide.arrived = true;
    this.activeRides.set(userApiId, activeRide);

    const notification: PushNotification = {
      recipients: {subscription_ids: [activeRide.issuer.notificationSubId]},
      title: {es: `${client.data.username} está afuera!`, en: `${client.data.username} is outside!`},
      content: {es: `${client.data.username} llegó a tu dirección.`, en: `${client.data.username} has arrived to your address.`},
      android_channel: 'Ride state',
    }

    await OneSignalStaticClass.createPushNotification(notification);
    this.server.to(activeRide.issuer.socketId).emit('taxi-arrived');
  }

  @SubscribeMessage('cancel-ride-because-user-disconnect')
  async cancelRideBecauseUserDisconnect(@MessageBody() data: { userApiId: string | null }, @ConnectedSocket() client: Socket) {
    let userApiId = data.userApiId;
    if (!userApiId) { // In case use api id is not provided
      for (let [userId, activeRide] of this.activeRides) {
        if (activeRide.taxi && activeRide.taxi === client.data.apiId) {
          userApiId = userId;
          break;
        }
      }
    }
    if (!userApiId) return;

    const activeRide = this.activeRides.get(userApiId);
    if (!activeRide) return;

    const notification: PushNotification = {
      recipients: {subscription_ids: [activeRide.issuer.notificationSubId]},
      title: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
      content: {es: `${client.data.username} canceló el viaje luego de que te hayas desconectado por más de 5 minutos.`, en: `${client.data.username} has cancelled the ride after you disconnected for more than 5 minutes.`},
      android_channel: 'Ride state',
    }

    await OneSignalStaticClass.createPushNotification(notification);

    if (activeRide.rideId) {
      await this.ridesService.update(activeRide.rideId, {
        wasCancelled: true,
        cancellationReason: CancellationReason.USER_DISCONNECT
      });
    }

    this.activeRides.delete(userApiId);
  }

  @SubscribeMessage('taxi-cancel-ride')
  async taxiCancelRide(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    const activeRide = this.activeRides.get(userApiId);

    if (!activeRide) {
      console.log('On taxi-cancel-ride event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    // In the frontend it should never let the taxi cancel a ride if it has already arrived.
    if (activeRide.arrived) return;

    this.activeRides.delete(userApiId);

    const notification: PushNotification = {
      recipients: {subscription_ids: [activeRide.issuer.notificationSubId]},
      title: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
      content: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
      android_channel: 'Ride state',
    }

    await OneSignalStaticClass.createPushNotification(notification);
    this.server.to(activeRide.issuer.socketId).emit('taxi-cancel-ride');
  }

  @SubscribeMessage('ride-completed')
  async rideCompleted(@MessageBody() data: { userApiId: string }) {
    const { userApiId } = data;
    const activeRide = this.activeRides.get(userApiId);

    if (!activeRide) {
      console.log('On ride-completed event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    if (!activeRide.rideId) {
      console.log('On ride-completed event, activeRide.rideId returned undefined.');
      return;
    }

    const rideId = activeRide.rideId;
    this.server.to(activeRide.issuer.socketId).emit('ride-completed');
    this.activeRides.delete(userApiId);
    await this.ridesService.update(rideId, {finishedTimestamp: new Date()});
  }

  @SubscribeMessage('taxi-location-updated')
  taxiLocationUpdated(@MessageBody() data: { location: LatLng }, @ConnectedSocket() client: Socket) {
    const { location } = data;
    this.taxisLocation.set(client.data.apiId, {
      location: location,
      lastUpdate: new Date(),
    });
  }

  // ---------------------------------------------------- User Server-Side Only Functions  ----------------------------------------------------

  async resolveNewRideRequest(userApiId: string) {
    let activeRide = this.activeRides.get(userApiId);
    if (!activeRide) {
      console.log('On resolveNewRideRequest, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    const nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      const taxiConnection = MainGateway.connections.get(nearestTaxi.id);

      if (!taxiConnection) {
        console.log('On resolveNewRideRequest, MainGateway.connections.get(nearestTaxi.id) returned undefined.');
        return;
      }

      activeRide.currentRequested = nearestTaxi.id;
      this.taxisAvailable.delete(nearestTaxi.id);

      this.beingRequested.set(nearestTaxi.id, taxiConnection);

      const notification: PushNotification = {
        recipients: {subscription_ids: [taxiConnection.notificationSubId]},
        title: {es: `Viaje solicitado!`, en: `Ride requested!`},
        content: {es: `${activeRide.issuer.username} solicitó un viaje, lo tomarás?`, en: `${activeRide.issuer.username} request a ride, will you accept it?`},
        android_channel: 'Ride state',
      }

      const notificationResponse = await OneSignalStaticClass.createPushNotification(notification);
      activeRide.requestRidePushNotification = notificationResponse.id;

      this.server.to(taxiConnection.socketId).emit('ride-request', activeRide.ride, userApiId, activeRide.issuer.username);

    } else {
      this.server.to(activeRide.issuer.socketId).emit('all-taxis-reject');
      this.activeRides.delete(userApiId);
    }
  }

  /**
   * @param alreadyRequesteds
   * @param ride
   * @returns An object with null values or an object with taxi values.
   */
  getNearestTaxi(alreadyRequesteds: string[], ride: RideWithAddresses) {
    let nearestTaxi: {
      id: null | string;
      distance: null | number;
    } = {
      id: null,
      distance: null,
    };

    this.taxisLocation.forEach((obj, id) => {
      // CHECK IF THE TAXI IS BEING REQUESTED AT THIS MOMENT
      if (this.beingRequested.has(id)) return;
      // CHECK IF THE TAXI ALREADY WAS REQUESTED BY THIS RIDE
      const alreadyRequested = alreadyRequesteds.find((r) => r == id);
      if (alreadyRequested) return;

      let location = obj.location;
      const currentDistance = calculateDistances(ride.origin.location, location);
      if (nearestTaxi.distance == null || nearestTaxi.distance > currentDistance) {
        nearestTaxi = {
          id: id,
          distance: currentDistance,
        };
      }
    });

    return nearestTaxi;
  }

  async handleRideResponse(accepted: boolean, taxiApiId: string, taxiUsername: string, userApiId: string) {
    const activeRide = this.activeRides.get(userApiId);
    this.beingRequested.delete(taxiApiId);

    if (!activeRide) {
      console.log('On handleRideResponse, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    const taxiConnection = MainGateway.connections.get(taxiApiId);
    if (!taxiConnection) {
      console.log('On handleRideResponse, MainGateway.connections.get(taxiApiId) returned undefined.');
      return;
    }

    if (accepted) {
      activeRide.taxi = taxiConnection;
      const taxiLocation = this.taxisLocation.get(taxiApiId)?.location;
      this.server.to(activeRide.issuer.socketId).emit('taxi-confirmed-ride', taxiUsername, taxiLocation);

      try {
        const response = await this.ridesService.insert({
          user_id: userApiId, driver_id: taxiApiId,
          originShortAddress: activeRide.ride.origin.shortAddress, originLongAddress: activeRide.ride.origin.longAddress,
          originLatitude: activeRide.ride.origin.location.latitude, originLongitude: activeRide.ride.origin.location.longitude, 
          destinationShortAddress: activeRide.ride.destination.shortAddress, destinationLongAddress: activeRide.ride.destination.longAddress,
          destinationLatitude: activeRide.ride.destination.location.latitude, destinationLongitude: activeRide.ride.destination.location.longitude, 
        });

        activeRide.rideId = response.id;
        this.activeRides.set(userApiId, activeRide);
        this.taxisLocation.delete(taxiApiId);
        const notification: PushNotification = {
          recipients: {subscription_ids: [activeRide.issuer.notificationSubId]},
          title: {es: `Viaje aceptado!`, en: `Ride accepted!`},
          content: {es: `${taxiUsername} aceptó tu pedido de viaje.`, en: `${taxiUsername} accepted your ride request.`},
          android_channel: 'Ride state',
        }
        await OneSignalStaticClass.createPushNotification(notification);
      } catch (error) {
        this.activeRides.delete(userApiId);
        this.server.to(activeRide.issuer.socketId).emit('taxi-cancelled-ride'); // Its not actually a cancelled ride event.
        const taxiConnection = MainGateway.connections.get(taxiApiId);
        
        if (!taxiConnection) {
          console.log('On handleRideResponse, MainGateway.connections.get(taxiApiId) returned undefined.');
          return;
        }

        this.server.to(taxiConnection.socketId).emit('user-cancelled-ride'); // Its not actually a cancelled ride event.
      }
      
    } else {
      activeRide.currentRequested = undefined;
      
      const allTaxisHaveBeenRequested = activeRide.alreadyRequesteds.length == this.taxisAvailable.size;

      if (allTaxisHaveBeenRequested) {
        this.activeRides.delete(userApiId);
        this.server.to(activeRide.issuer.socketId).emit('all-taxis-reject');
        return;
      }
      activeRide.alreadyRequesteds.push(taxiApiId);

      await this.checkLastLocationUpdate(userApiId);
    }
  }

  async checkLastLocationUpdate(userApiId: string, iteration = 1) { // iteration can only be 1 (by default) or 2
    const activeRide = this.activeRides.get(userApiId);
    let waitTaxisUpdateLocation = false;

    this.taxisAvailable.forEach((taxiSocketId, taxiApiId) => {
      const cantRequestLocation = activeRide?.alreadyRequesteds.find((r) => r == taxiApiId);
      if (cantRequestLocation) return;

      const lastUpdate = this.taxisLocation.get(taxiApiId)?.lastUpdate;
      if (!lastUpdate || (lastUpdate < new Date(new Date().setSeconds((this.frequencyToCheckLastUpdate * -1) + (iteration === 2 ? 5 : 0))))) {
        this.server.to(taxiSocketId).emit('update-taxi-location');
        waitTaxisUpdateLocation = true;
      }
    });

    if (waitTaxisUpdateLocation) {
      setTimeout(async () => {
        // If user cancel ride before the timeout being executed, active ride will be undefined
        if (this.activeRides.get(userApiId) !== undefined) {
          if (iteration === 1) await this.checkLastLocationUpdate(userApiId, 2);
          else await this.resolveNewRideRequest(userApiId);
        }
      }, 5000);
    } else await this.resolveNewRideRequest(userApiId);
  }

  // ---------------------------------------------------- Handling Users Events ----------------------------------------------------

  @SubscribeMessage('user-reconnect')
  userReconnect(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;
    const activeRide = this.activeRides.get(userApiId);
    
    if (!activeRide) {
      console.log('On user-reconnect event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    if (activeRide.taxi === undefined) {
      console.log('On user-reconnect event, this.activeRides.get(userApiId).taxi was undefined.');
      return;
    }

    this.server.to(activeRide.taxi.socketId).emit('user-reconnect');
  }

  @SubscribeMessage('new-ride')
  async newRide(@MessageBody() data: { ride: RideWithAddresses }, @ConnectedSocket() client: Socket) {
    const { ride } = data;
    const userApiId: string = client.data.apiId;
    const username: string = client.data.username;

    if (
      !(
        ride &&
        ride.origin &&
        ride.origin.location.latitude &&
        ride.origin.location.longitude &&
        ride.destination &&
        ride.destination.location.latitude &&
        ride.destination.location.longitude
      )
    ) {
      console.log(`On new-ride event, the ride received from the frontend is undefined or has undefined attributes: ${ride}.`);
      return;
    }

    // This handle reviewers ride requests.
    if (client.data.isReviewer) {
      let taxi: SocketUser | undefined;
      for (let [userId, reviewConnection] of this.reviewConnections) {
        if (reviewConnection.role === 'taxi') {
          taxi = {...reviewConnection, apiId: userId, username: ''};
          break;
        }
      }
      if (taxi) {
        const notification: PushNotification = {
          recipients: {subscription_ids: [taxi.notificationSubId]},
          title: {es: `Viaje solicitado!`, en: `Ride requested!`},
          content: {es: `${client.data.username} solicitó un viaje, lo tomarás?`, en: `${client.data.username} request a ride, will you accept it?`},
          android_channel: 'Ride state',
        }
  
        const notificationResponse = await OneSignalStaticClass.createPushNotification(notification);

        this.activeRides.set(userApiId, {
          issuer: {
            socketId: client.id,
            apiId: client.data.apiId,
            username: username,
            notificationSubId: client.data.notificationSubId,
          },
          ride: ride,
          alreadyRequesteds: [],
          currentRequested: taxi.apiId,
          taxi: undefined,
          arrived: false,
          rideId: undefined,
          requestRidePushNotification: notificationResponse.id
        });
        this.server.to(taxi.socketId).emit('ride-request', ride, userApiId, username);
      } else this.server.to(client.id).emit('no-taxis-available');
      return;
    }

    let reviewersTaxiCount = 0;
    for (let [userId, reviewConnection] of this.reviewConnections) {
      if (reviewConnection.role === 'taxi') {
        reviewersTaxiCount++;
      }
    }

    const taxisAvailableWithoutReviewers = this.taxisAvailable.size - reviewersTaxiCount;

    if (taxisAvailableWithoutReviewers === 0) {
      this.server.to(client.id).emit('no-taxis-available');
      return;
    }

    this.activeRides.set(userApiId, {
      issuer: {
        socketId: client.id,
        apiId: client.data.apiId,
        username: username,
        notificationSubId: client.data.notificationSubId,
      },
      ride: ride,
      alreadyRequesteds: [],
      currentRequested: undefined,
      taxi: undefined,
      arrived: false,
      rideId: undefined,
      requestRidePushNotification: undefined
    });

    await this.checkLastLocationUpdate(userApiId);
  }

  @SubscribeMessage('user-cancel-ride')
  async userCancelRide(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;

    // If the ride doesnt exists in activeRides
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide == undefined) return;

    let taxiNotificationSubId;
    // In case taxi've already accepted the ride
    if (activeRide.taxi) {
      taxiNotificationSubId = activeRide.taxi.notificationSubId;
      this.server.to(activeRide.taxi.socketId).emit('user-cancel-ride');
    } else {
      // In case taxi've not accepted the ride yet
      if (activeRide.currentRequested) {
        const taxiBeingRequestedConnection = MainGateway.connections.get(activeRide.currentRequested);
        if (taxiBeingRequestedConnection != undefined) {
          taxiNotificationSubId = taxiBeingRequestedConnection.notificationSubId;
          this.beingRequested.delete(activeRide.currentRequested);
          this.server.to(taxiBeingRequestedConnection.socketId).emit('user-cancel-ride');
        }
      }
    }

    if (taxiNotificationSubId) {
      const notification: PushNotification = {
        recipients: {subscription_ids: [taxiNotificationSubId]},
        title: {es: `Viaje cancelado`, en: `Ride cancelled`},
        content: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
        android_channel: 'Ride state',
      }
  
      await OneSignalStaticClass.createPushNotification(notification);
    }

    let rideId = activeRide.rideId;
    this.activeRides.delete(userApiId);
    this.server.to(client.id).disconnectSockets();
    if (rideId)
      await this.ridesService.update(rideId, {wasCancelled: true, cancellationReason: CancellationReason.USER_CANCEL});
  }

  @SubscribeMessage('cancel-ride-because-taxi-disconnect')
  async cancelRideBecauseTaxiDisconnect(@ConnectedSocket() client: Socket) {
    const activeRide = this.activeRides.get(client.data.apiId);
    if (!activeRide) return;

    if (activeRide.taxi) {
      const notification: PushNotification = {
        recipients: {subscription_ids: [activeRide.taxi.notificationSubId]},
        title: {es: `${client.data.username} canceló el viaje`, en: `${client.data.username} cancelled the ride`},
        content: {es: `${client.data.username} canceló el viaje luego de que te hayas desconectado por más de 5 minutos.`, en: `${client.data.username} has cancelled the ride after you disconnected for more than 5 minutes.`},
        android_channel: 'Ride state',
      }
  
      await OneSignalStaticClass.createPushNotification(notification);
    }
    
    if (activeRide.rideId) {
      await this.ridesService.update(activeRide.rideId, {
        wasCancelled: true,
        cancellationReason: CancellationReason.TAXI_DISCONNECT
      });
    }
    this.activeRides.delete(client.data.apiId);
    this.server.to(client.id).disconnectSockets();
  }

}