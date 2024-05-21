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
import { LatLng, RideWithAddresses } from 'src/Types/Location.type';
import { calculateDistances } from './Utils';
import { SocketDoubleConnectionMiddleWare } from './middlewares/double-connection-middleware';
import { RidesService } from 'src/rides/rides.service';
import { CancellationReason } from 'src/rides/entities/CancellationReason.enum';

export type activeRideType = {
  issuer: {
    socketId: string,
    username: string,
  }
  ride: RideWithAddresses;
  alreadyRequesteds: string[];
  currentRequested: string | undefined;
  taxi: string | undefined;
  arrived: boolean;
  rideId: string | undefined;
};

type taxiLocationType = {
  location: LatLng;
  lastUpdate: Date;
};

type connectionsType = {
  socketId: string,
  username: string,
}

type beingRequestedType = {
  issuerApiId: string,
  issuerUsername: string,
}

type reviewConnectionsType = {
  socketId: string,
  role: 'user' | 'taxi',
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
  public static connections: Map<string, connectionsType> = new Map<string, connectionsType>();
  private activeRides: Map<string, activeRideType> = new Map<string, activeRideType>();
  private taxisLocation: Map<string, taxiLocationType> = new Map<string, taxiLocationType>();
  private frequencyToCheckLastUpdate = 10;
  private taxisAvailable: Map<string, string> = new Map<string, string>();
  private beingRequested: Map<string, beingRequestedType> = new Map<string, beingRequestedType>();

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
      if (client.data.reconnectionCheck == true) {
        for (const [userApiId, activeRide] of this.activeRides) {
          // If exists an active ride with the user api id equals to current connection id.
          if (apiId == userApiId) {
            let taxiName = null;
            if (activeRide.taxi && MainGateway.connections.get(activeRide.taxi)) taxiName = MainGateway.connections.get(activeRide.taxi)?.username;
            this.server.to(client.id).emit('reconnect-after-reconnection-check', 'user', activeRide.ride, activeRide.arrived, taxiName, ''); // Don't send taxi id on porpouse, because in the front its not used.
            break;
          }
          // If exists an active ride with the taxi api id equals to current connection id.
          if (apiId == activeRide.taxi) {
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
      username: client.data.username
    }); // Example: ['2', { socketId: 'SGS345rGDS$w', username: 'Juan Ramirez' }]

    if (client.data.isReviewer) {
      this.reviewConnections.set(apiId, {
        socketId: client.id,
        role: client.data.role,
      });
    }

    if (client.data.role == 'taxi') {
      let hasAnActiveRide = false;
      for (const [userApiId, activeRide] of this.activeRides) {
        if (activeRide.taxi == apiId) {
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
  handleDisconnect(client: Socket) {
    let apiId: string | undefined;
    for (const entry of MainGateway.connections.entries()) {
      if (entry[1].socketId == client.id) apiId = entry[0];
    }
    if (apiId === undefined) {
      console.log(`Cant find apiId in MainGateway.connections: ${client.data.apiId}.`);
      return;
    }
    // TODO:
    // If user disconnects when its on a ride request, the taxi is notified and after
    // x amount of time it should decide if cancel the ride.
    if (client.data.role == 'user') {
      const activeRide = this.activeRides.get(apiId);
      if (activeRide != undefined && !activeRide.arrived) {
        // If the ride emitted was accepted
        if (activeRide.taxi != undefined) {
          const taxiConnection = MainGateway.connections.get(activeRide.taxi);
          if (taxiConnection != undefined) {
            this.server.to(taxiConnection.socketId).emit('user-disconnect', activeRide.rideId);
          }
        } else {
          // If the ride emitted isn't accepted yet
          if (activeRide.currentRequested != undefined) { // If exists a taxi who's being requested
            const taxiConnection = MainGateway.connections.get(activeRide.currentRequested);
            this.beingRequested.delete(activeRide.currentRequested);
            if (taxiConnection) {
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
      
      if (this.beingRequested.has(apiId)) {
        const issuer = this.beingRequested.get(apiId);
        if (issuer) this.handleRideResponse(false, apiId, client.data.username, issuer.issuerApiId);

      } else if (!this.taxisAvailable.has(apiId)) {
        this.activeRides.forEach((activeRide, userApiId) => {

          if (activeRide.taxi && activeRide.taxi === apiId) {
            const userSocketId = MainGateway.connections.get(userApiId);
            if (userSocketId)
              this.server.to(userSocketId.socketId).emit('taxi-disconnect');
          }
        });
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
        const userConnection = MainGateway.connections.get(userId);
        
        if (userConnection != undefined)
          this.server.to(userConnection.socketId).emit('taxi-reconnect');
        else 
          console.log('On taxi-reconnect event, active ride was found but userSocketId its undefined when searching in MainGateway.connections.get(userId).');
        
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
    const userConnection = MainGateway.connections.get(userApiId);
    
    if (!userConnection) {
      // Console log commented since the user can be disconnected, when reconnects it should receive this state
      // console.log('On location-update-for-user event, MainGateway.connections.get(userApiId) returned undefined.');
      return;
    }

    this.server.to(userConnection.socketId).emit('location-update-from-taxi', username, location);
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
  taxiArrived(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    let ride = this.activeRides.get(userApiId);

    if (!ride) {
      console.log('On taxi-arrived event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    if (!ride.rideId) {
      console.log('On taxi-arrived event, ride.rideId returned undefined.');
      return;
    }
    
    this.ridesService.update(ride.rideId, {arrivedTimestamp: new Date()});
    ride.arrived = true;
    this.activeRides.set(userApiId, ride);
    const userConnection = MainGateway.connections.get(userApiId);

    if (!userConnection) {
      // Console log commented since the user can be disconnected, when reconnects it should receive this state
      // console.log('On taxi-arrived event, MainGateway.connections.get(userApiId) returned undefined.');
      return;
    }

    this.server.to(userConnection.socketId).emit('taxi-arrived');
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
    
    if (activeRide.rideId) {
      await this.ridesService.update(activeRide.rideId, {
        wasCancelled: true,
        cancellationReason: CancellationReason.USER_DISCONNECT
      });
    }

    this.activeRides.delete(userApiId);
  }

  @SubscribeMessage('taxi-cancel-ride')
  taxiCancelRide(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    const activeRide = this.activeRides.get(userApiId);

    if (!activeRide) {
      console.log('On taxi-cancel-ride event, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    // In the frontend it should never let the taxi cancel a ride if it has already arrived.
    if (activeRide.arrived) return;

    this.activeRides.delete(userApiId);
    const userConnection = MainGateway.connections.get(userApiId);

    if (!userConnection) {
      console.log('On taxi-cancel-ride event, MainGateway.connections.get(userApiId) returned undefined.');
      return;
    }

    this.server.to(userConnection.socketId).emit('taxi-cancel-ride');
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

    await this.ridesService.update(activeRide.rideId, {finishedTimestamp: new Date()});
    this.activeRides.delete(userApiId);
    const userConnection = MainGateway.connections.get(userApiId);

    if (!userConnection) {
      // Console log commented since the user can be disconnected, when reconnects it should receive this state
      // console.log('On ride-completed event, MainGateway.connections.get(userApiId) returned undefined.');
      return;
    }

    this.server.to(userConnection.socketId).emit('ride-completed');
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

  resolveNewRideRequest(userApiId: string) {
    let activeRide = this.activeRides.get(userApiId);
    if (!activeRide) {
      console.log('On resolveNewRideRequest, this.activeRides.get(userApiId) returned undefined.');
      return;
    }

    const nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      const taxiSocketId = this.taxisAvailable.get(nearestTaxi.id);

      if (!taxiSocketId) {
        console.log('On resolveNewRideRequest, this.taxisAvailable.get(nearestTaxi.id) returned undefined.');
        return;
      }

      activeRide.currentRequested = nearestTaxi.id;
      this.taxisAvailable.delete(nearestTaxi.id);

      this.beingRequested.set(nearestTaxi.id, {
        issuerApiId: userApiId,
        issuerUsername: activeRide.issuer.username
      });

      this.server.to(taxiSocketId).emit('ride-request', activeRide.ride, userApiId, activeRide.issuer.username);

    } else {
      const userConnection = MainGateway.connections.get(userApiId);

      if (!userConnection) {
        console.log('On resolveNewRideRequest, MainGateway.connections.get(userApiId) returned undefined.');
        return;
      }

      this.server.to(userConnection.socketId).emit('all-taxis-reject');
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
      //this.server.to(taxiApiId).emit('notify-error-msg', `The active ride from user ${userApiId} its undefined.`);
      return;
    }
    
    const userConnection = MainGateway.connections.get(userApiId);
    if (!userConnection) {
      console.log('On handleRideResponse, MainGateway.connections.get(userApiId) returned undefined.');
      return;
    }

    if (accepted) {
      activeRide.taxi = taxiApiId;
      const taxiLocation = this.taxisLocation.get(taxiApiId)?.location;
      this.server.to(userConnection.socketId).emit('taxi-confirmed-ride', taxiUsername, taxiLocation);

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
      } catch (error) {
        this.activeRides.delete(userApiId);
        this.server.to(userConnection.socketId).emit('taxi-cancelled-ride'); // Its not actually a cancelled ride event.
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
        this.server.to(userConnection.socketId).emit('all-taxis-reject');
        return;
      }
      activeRide.alreadyRequesteds.push(taxiApiId);

      this.checkLastLocationUpdate(userApiId);
    }
  }

  checkLastLocationUpdate(userApiId: string, iteration = 1) { // iteration can only be 1 (by default) or 2
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
      setTimeout(() => {
        // If user cancel ride before the timeout being executed, active ride will be undefined
        if (this.activeRides.get(userApiId) !== undefined) {
          if (iteration === 1) this.checkLastLocationUpdate(userApiId, 2);
          else this.resolveNewRideRequest(userApiId);
        }
      }, 5000);
    } else this.resolveNewRideRequest(userApiId);
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

    const taxiConnection = MainGateway.connections.get(activeRide.taxi);

    if (!taxiConnection) {
      console.log('On user-reconnect event, MainGateway.connections.get(activeRide.taxi) returned undefined');
      return;
    }

    this.server.to(taxiConnection.socketId).emit('user-reconnect');
  }

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: { ride: RideWithAddresses }, @ConnectedSocket() client: Socket) {
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
      // TODO: handle the following event in the user frontend side.
      // this.server.to(client.id).emit('notify-error-msg', 'The received ride from the server is undefined or has undefined attributes.');
      return;
    }

    // This handle reviewers ride requests.
    if (client.data.isReviewer) {
      let taxiSocketId;
      let taxiApiId;
      for (let [userId, reviewConnection] of this.reviewConnections) {
        if (reviewConnection.role === 'taxi') {
          taxiSocketId = reviewConnection.socketId;
          taxiApiId = userId;
          break;
        }
      }
      if (taxiSocketId) {
        this.activeRides.set(userApiId, {
          issuer: {
            socketId: client.id,
            username: username,
          },
          ride: ride,
          alreadyRequesteds: [],
          currentRequested: taxiApiId,
          taxi: undefined,
          arrived: false,
          rideId: undefined
        });
        this.server.to(taxiSocketId).emit('ride-request', ride, userApiId, username);
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
        username: username,
      },
      ride: ride,
      alreadyRequesteds: [],
      currentRequested: undefined,
      taxi: undefined,
      arrived: false,
      rideId: undefined
    });

    this.checkLastLocationUpdate(userApiId);
  }

  @SubscribeMessage('user-cancel-ride')
  async userCancelRide(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;

    // If the ride doesnt exists in activeRides
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide == undefined) return;

    // In case taxi've already accepted the ride
    const taxiApiId = activeRide.taxi;
    if (taxiApiId != undefined) {
      const taxiConnection = MainGateway.connections.get(taxiApiId);
      if (taxiConnection != undefined) {
        this.server.to(taxiConnection.socketId).emit('user-cancel-ride');
      }
    } else {
      // In case taxi've not accepted the ride yet
      const taxiBeingRequestedApiId = activeRide.currentRequested;
      if (taxiBeingRequestedApiId != undefined) {
        const taxiBeingRequestedConnection = MainGateway.connections.get(taxiBeingRequestedApiId);
        if (taxiBeingRequestedConnection != undefined) {
          this.beingRequested.delete(taxiBeingRequestedApiId);
          this.server.to(taxiBeingRequestedConnection.socketId).emit('user-cancel-ride');
        }
      }
    }

    this.server.to(client.id).disconnectSockets();
    if (activeRide.rideId)
      await this.ridesService.update(activeRide.rideId, {wasCancelled: true, cancellationReason: CancellationReason.USER_CANCEL});
    this.activeRides.delete(userApiId);
  }

  @SubscribeMessage('cancel-ride-because-taxi-disconnect')
  async cancelRideBecauseTaxiDisconnect(@ConnectedSocket() client: Socket) {
    const activeRide = this.activeRides.get(client.data.apiId);
    if (!activeRide) return;
    
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