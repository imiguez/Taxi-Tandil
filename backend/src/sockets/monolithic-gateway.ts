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
import { LatLng, Ride } from 'src/Types/Location.type';
import { calculateDistances } from './Utils';
import { SocketDoubleConnectionMiddleWare } from './middlewares/double-connection-middleware';
import { RidesService } from 'src/rides/rides.service';

export type activeRideType = {
  issuer: {
    socketId: string,
    username: string,
  }
  ride: Ride;
  alreadyRequesteds: string[];
  currentRequested: {
    apiId: string,
    state: 'emitted' | 'response-provided'
  } | undefined;
  taxi: string | undefined;
  arrived: boolean;
  rideId: number | undefined;
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
    console.log(client.id, apiId);
    

    if (client.recovered) {
      console.log('RECOVERED!');
    } else {
      // Handle reconnection
      if (client.data.reconnectionCheck == true) {
        this.activeRides.forEach((activeRide, userApiId) => {
          // If exists an active ride with the user api id equals to current connection id.
          if (apiId == userApiId) {
            this.server.to(client.id).emit('reconnect-after-reconnection-check', 'user', activeRide.ride, activeRide.arrived, activeRide.taxi);
            return;
          }
          // If exists an active ride with the taxi api id equals to current connection id.
          if (apiId == activeRide.taxi) {
            this.server.to(client.id).emit('reconnect-after-reconnection-check', 'taxi', activeRide.ride, activeRide.arrived, userApiId);
            return;
          }
        });
        // If execution reach this point it means the client doesnt have to recconect, so close the connection until necessary.
        client.disconnect();
        return;
      }
    }

    MainGateway.connections.set(apiId, {
      socketId: client.id,
      username: client.data.username
    }); // Example: ['2', { socketId: 'SGS345rGDS$w', username: 'Juan Ramirez' }]

    if (client.data.role == 'taxi') {
      let hasAnActiveRide = false;
      this.activeRides.forEach((activeRide) => {
        if (activeRide.taxi == apiId) {
          hasAnActiveRide = true;
          return;
        }
      });

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
    console.log('disconnecting user: ', client.data.apiId, client.id);
    let apiId;
    for (const entry of MainGateway.connections.entries()) {
      if (entry[1].socketId == client.id) apiId = entry[0];
    }
    if (apiId == undefined) {
      console.log('Cant find apiId: ', apiId);
      return;
    }
    // TODO:
    // If user disconnects when its on a ride request, the taxi is notified and after
    // x amount of time it should decide if cancel the ride.
    if (client.data.role == 'user') {
      const activeRide = this.activeRides.get(apiId);
      if (activeRide != undefined) {
        // If the ride emmited was accepted and taxi didn't arrive yet
        if (activeRide.taxi != undefined && !activeRide.arrived) {
          const taxiConnection = MainGateway.connections.get(activeRide.taxi);
          if (taxiConnection != undefined) {
            this.server.to(taxiConnection.socketId).emit('user-disconnect', activeRide.rideId);
          }
        } else {
          // If the ride emmited isn't accepted yet
          if (activeRide.currentRequested != undefined) { // If exists a taxi who's being requested
            const taxiConnection = MainGateway.connections.get(activeRide.currentRequested.apiId);
            this.beingRequested.delete(activeRide.currentRequested.apiId);
            if (taxiConnection) {
              this.server.to(taxiConnection.socketId).emit('user-disconnect', null);
            }
          }
          this.activeRides.delete(apiId);
        }
      }
    }

    MainGateway.connections.delete(apiId);

    if (client.data.role == 'taxi') {
      if (this.beingRequested.has(apiId)) {
        const issuer = this.beingRequested.get(apiId)!;
        this.handleRideResponse(false, apiId, client.data.username, issuer.issuerApiId);
      }
      
      this.taxisAvailable.delete(apiId);
      this.taxisLocation.delete(apiId);
      console.log(`${apiId} deleted from connections, taxisAvailable and taxisLocation.`);
    }
  }

  // ---------------------------------------------------- Taxi Server-Side Only Functions -----------------------------------------------

  onNewTaxiAvailable(taxiApiId: string, taxiSocketId: string, location: LatLng) {
    console.log('New taxi available: ', taxiApiId, location);
    this.taxisAvailable.set(taxiApiId, taxiSocketId);
    this.taxisLocation.set(taxiApiId, {
      location: location,
      lastUpdate: new Date(),
    });
  }

  updateRideId(userApiId: string, taxiApiId: string, rideId: number) {
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
    this.activeRides.forEach((activeRide, key) => {
      if (activeRide.taxi && activeRide.taxi === client.data.apiId) {
        const userConnection = MainGateway.connections.get(key);
        if (userConnection != undefined)
          this.server.to(userConnection.socketId).emit('taxi-reconnect');
        else 
          console.log('userSocketId its undefined');
        return;
      }
    })
  }


  @SubscribeMessage('location-updated-to-be-available')
  locationUpdatedToBeAvailable(@MessageBody() data: { location: LatLng }, @ConnectedSocket() client: Socket) {
    const { location } = data;
    this.server.to(client.id).emit('location-updated-to-be-available-received');
    this.onNewTaxiAvailable(client.data.apiId, client.id, location);
  }

  @SubscribeMessage('location-update-for-user')
  locationUpdateForUser(@MessageBody() data: { location: LatLng; userApiId: string }, @ConnectedSocket() client: Socket) {
    let { location, userApiId } = data;

    this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('location-update-from-taxi', location, client.id);
  }

  @SubscribeMessage('ride-response')
  rideResponse(@MessageBody() data: { accepted: boolean, userApiId: string }, @ConnectedSocket() client: Socket) {
    const { accepted, userApiId } = data;
    const taxiApiId = client.data.apiId;
    const taxiUsername = client.data.username;
    const activeRide = this.activeRides.get(userApiId);
    if (!activeRide) return;
    if (activeRide.currentRequested)
      activeRide.currentRequested.state = 'response-provided';
    
    console.log(`emmiting ride response from ${taxiUsername} to ${userApiId}`);

    this.handleRideResponse(accepted, taxiApiId, taxiUsername, userApiId);
  }

  @SubscribeMessage('taxi-arrived')
  taxiArrived(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    let ride = this.activeRides.get(userApiId)!;
    this.ridesService.update(ride.rideId!, {arrivedTimestamp: new Date()});
    ride.arrived = true;
    this.activeRides.set(userApiId, ride);
    const userConnection = MainGateway.connections.get(userApiId)!;
    this.server.to(userConnection.socketId).emit('taxi-arrived');
  }

  @SubscribeMessage('cancel-ride-because-user-disconnect')
  async cancelRideBecauseUserDisconnect(@MessageBody() data: { userApiId: string}) {
    const { userApiId } = data;
    this.activeRides.delete(userApiId);
  }

  @SubscribeMessage('taxi-cancel-ride')
  taxiCancelRide(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;

    // In the frontend it should never let the taxi cancel a ride if it has already arrived.
    if (this.activeRides.get(userApiId)?.arrived) return;

    this.activeRides.delete(userApiId);
    this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('taxi-cancel-ride');
  }

  @SubscribeMessage('ride-completed')
  async rideCompleted(@MessageBody() data: { userApiId: string }) {
    const { userApiId } = data;
    await this.ridesService.update(this.activeRides.get(userApiId)?.rideId!, {finishedTimestamp: new Date()});
    this.activeRides.delete(userApiId);
    const userConnection = MainGateway.connections.get(userApiId)!;
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
    if (activeRide == undefined) {
      console.log('activeRides.get(' + userApiId + ') is undefined.');
      return;
    }

    const nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      const taxiSocketId = this.taxisAvailable.get(nearestTaxi.id)!;

      activeRide.currentRequested = {
        apiId: nearestTaxi.id,
        state: 'emitted',
      };

      this.taxisAvailable.delete(nearestTaxi.id);
      this.taxisLocation.delete(nearestTaxi.id);
      this.beingRequested.set(nearestTaxi.id, {
        issuerApiId: userApiId,
        issuerUsername: activeRide.issuer.username
      });

      this.server.to(taxiSocketId).emit('ride-request', activeRide.ride, userApiId, activeRide.issuer.username);
      console.log('ride-request emitted to ' + nearestTaxi.id + ' !');

      let countdown = 20;
      const interval = setInterval(() => {
        activeRide = this.activeRides.get(userApiId);
        if (activeRide && activeRide.currentRequested && activeRide.currentRequested.state === 'emitted') {
          if (countdown > 0) {
            if (countdown-1 === 0) this.server.volatile.to(taxiSocketId).emit('countdown-finished', 'timeout');
            else this.server.volatile.to(taxiSocketId).emit('countdown', countdown);
          } else {
            this.handleRideResponse(false, nearestTaxi.id!, MainGateway.connections.get(nearestTaxi.id!)?.socketId!, userApiId);
            clearInterval(interval);
          }
        } else {
          this.server.volatile.to(taxiSocketId).emit('countdown-finished');
          clearInterval(interval);
        }
        countdown--;
      }, 1000);

    } else {
      console.log('None of all taxis accept the request.');
      this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('all-taxis-reject');
      this.activeRides.delete(userApiId);
    }
  }

  /**
   * @param alreadyRequesteds
   * @param ride
   * @returns An object with null values or an object with taxi values.
   */
  getNearestTaxi(alreadyRequesteds: string[], ride: Ride) {
    let nearestTaxi: {
      id: null | string;
      distance: null | number;
    } = {
      id: null,
      distance: null,
    };

    this.taxisLocation.forEach((obj, id) => {
      // CHECK IF THE TAXI IS BEING REQUESTED AT THIS MOMENT
      if (this.beingRequested.has(id)) {
        console.log(`${id} is being requested.`);
        return;
      }
      // CHECK IF THE TAXI ALREADY WAS REQUESTED BY THIS RIDE
      const alreadyRequested = alreadyRequesteds.find((r) => r == id);
      if (alreadyRequested) {
        console.log(`${id} has been requested.`);
        return;
      }

      let location = obj.location;
      const currentDistance = calculateDistances(ride.origin, location);
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
    const activeRide = this.activeRides.get(userApiId)!;
    this.beingRequested.delete(taxiApiId);

    if (activeRide == undefined) {
      console.log(`The active ride from user ${userApiId} its undefined.`);
      //this.server.to(taxiApiId).emit('notify-error-msg', `The active ride from user ${userApiId} its undefined.`);
      return;
    }

    if (accepted) {
      activeRide.taxi = taxiApiId;
      const taxiLocation = this.taxisLocation.get(taxiApiId)?.location;
      this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('taxi-confirmed-ride', taxiApiId, taxiUsername, taxiLocation);

      try {
        const response = await this.ridesService.insert({
          user_id: Number(userApiId), driver_id: Number(taxiApiId),
          originLatitude: activeRide.ride.origin.latitude, originLongitude: activeRide.ride.origin.longitude, 
          destinationLatitude: activeRide.ride.destination.latitude, destinationLongitude: activeRide.ride.destination.longitude, 
        });
        activeRide.rideId = response.id;
        this.activeRides.set(userApiId, activeRide);
        this.taxisLocation.delete(taxiApiId);
      } catch (error) {
        this.activeRides.delete(userApiId);
        this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('taxi-cancelled-ride'); // Its not actually a cancelled ride event.
        this.server.to(MainGateway.connections.get(taxiApiId)?.socketId!).emit('user-cancelled-ride'); // Its not actually a cancelled ride event.
      }
      
    } else {
      activeRide.currentRequested = undefined;
      if (activeRide.alreadyRequesteds.length == this.taxisAvailable.size) {
        this.activeRides.delete(userApiId);
        console.log('None of all taxis was requested.');
        this.server.to(MainGateway.connections.get(userApiId)?.socketId!).emit('all-taxis-reject');
        return;
      }
      activeRide.alreadyRequesteds.push(taxiApiId);
      console.log(`searching new taxi, taxis availables already requested for this ride: ${activeRide.alreadyRequesteds.length}`);

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
      if (lastUpdate && lastUpdate < new Date(new Date().setSeconds((this.frequencyToCheckLastUpdate * -1) + (iteration === 2 ? 5 : 0)))) {
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
    if (activeRide != undefined && activeRide.taxi != undefined) {
      const taxiConnection = MainGateway.connections.get(activeRide.taxi);
      if (taxiConnection != undefined)
        this.server.to(taxiConnection.socketId).emit('user-reconnect');
      else
        console.log('The socket id from activeRide.taxi its undefined');
    } else 
      console.log('activeRide or activeRide.taxi its undefined');
  }

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: { ride: Ride }, @ConnectedSocket() client: Socket) {
    const { ride } = data;
    const userApiId: string = client.data.apiId;
    const username: string = client.data.username;

    if (
      !(
        ride &&
        ride.origin &&
        ride.origin.latitude &&
        ride.origin.longitude &&
        ride.destination &&
        ride.destination.latitude &&
        ride.destination.longitude
      )
    ) {
      console.log('The received ride from the server is undefined or has undefined attributes.');
      // TODO: handle the following event in the user frontend side.
      this.server.to(client.id).emit('notify-error-msg', 'The received ride from the server is undefined or has undefined attributes.');
      return;
    }

    if (this.taxisAvailable.size === 0) {
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
  userCancelRide(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;

    // If the ride doesnt exists in activeRides
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide == undefined) return;

    // In case taxi've not accepted the ride yet
    const taxiBeingRequestedApiId = activeRide.currentRequested?.apiId;
    if (taxiBeingRequestedApiId != undefined) {
      const taxiBeingRequestedSocketId = MainGateway.connections.get(taxiBeingRequestedApiId)?.socketId;
      if (taxiBeingRequestedSocketId != undefined) {
        console.log(`${taxiBeingRequestedApiId} deleted from beingRequested.`);
        this.beingRequested.delete(taxiBeingRequestedApiId);
        this.server.to(taxiBeingRequestedSocketId).emit('user-cancel-ride');
      }
    }

    // In case taxi've already accepted the ride
    const taxiApiId = activeRide.taxi;
    if (taxiApiId != undefined) {
      const taxiConnection = MainGateway.connections.get(taxiApiId);
      if (taxiConnection != undefined) {
        console.log(`line 406 events emitted to ${taxiBeingRequestedApiId}.`);
        this.server.to(taxiConnection.socketId).emit('user-cancel-ride');
      }
    }
    this.activeRides.delete(userApiId);
    this.server.to(client.id).disconnectSockets();
  }
}