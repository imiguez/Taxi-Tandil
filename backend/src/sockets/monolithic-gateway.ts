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

export type activeRideType = {
  ride: Ride;
  alreadyRequesteds: string[];
  currentRequested: string | undefined;
  taxi: string | undefined;
  arrived: boolean;
  rideId: number | undefined;
};

type taxiLocationType = {
  location: LatLng;
  lastUpdate: Date;
};

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
  public static connections: Map<string, string> = new Map<string, string>();
  private activeRides: Map<string, activeRideType> = new Map<string, activeRideType>();
  private taxisLocation: Map<string, taxiLocationType> = new Map<string, taxiLocationType>();
  private taxisLocationLastUpdate: Date;
  private frequencyToCheckLastUpdate = 15;
  private taxisAvailable: Map<string, string> = new Map<string, string>();
  private beingRequested: Map<string, string> = new Map<string, string>();

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

    MainGateway.connections.set(apiId, client.id); // Example: ['2', 'SGS345rGDS$w']

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
      if (entry[1] == client.id) apiId = entry[0];
    }
    if (apiId == undefined) {
      console.log('Cant find apiId: ', apiId);
      return;
    }
    // TODO:
    // If user disconnects when its on a ride request, the taxi is notified and after
    // x amount of time it should decide if cancel the ride.
    const activeRide = this.activeRides.get(apiId);
    if (activeRide != undefined) {
      // If the ride emmited was accepted and taxi didn't arrive yet
      if (activeRide.taxi != undefined && !activeRide.arrived) {
        const taxiSocketId = MainGateway.connections.get(activeRide.taxi);
        if (taxiSocketId != undefined) {
          this.server.to(taxiSocketId).emit('user-disconnect', activeRide.rideId);
        }
      } else {
        // If the ride emmited isn't accepted yet
        if (activeRide.currentRequested != undefined) { // If exists a taxi who's being requested
          const taxiSocketId = MainGateway.connections.get(activeRide.currentRequested);
          this.beingRequested.delete(activeRide.currentRequested);
          if (taxiSocketId) {
            this.server.to(taxiSocketId).emit('user-disconnect', null);
          }
        }
        this.activeRides.delete(apiId);
      }
    }

    MainGateway.connections.delete(apiId);

    if (client.data.role == 'taxi') {
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
    const taxiSocketId = MainGateway.connections.get(taxiApiId);
    if (taxiSocketId === undefined) throw new Error('Taxi socket id doesnt exists.');
    this.server.to(taxiSocketId).emit('update-ride-id', rideId);
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide === undefined) throw new Error('Active ride undefined.');
    activeRide.rideId = rideId;
  }

  // ---------------------------------------------------- Handling Taxis Events ----------------------------------------------------

  @SubscribeMessage('taxi-reconnect')
  taxiReconnect(@ConnectedSocket() client: Socket) {
    this.activeRides.forEach((activeRide, key) => {
      if (activeRide.taxi && activeRide.taxi === client.data.apiId) {
        const userSocketId = MainGateway.connections.get(key);
        if (userSocketId != undefined)
          this.server.to(userSocketId).emit('taxi-reconnect');
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

    this.server.to(MainGateway.connections.get(userApiId)!).emit('location-update-from-taxi', location, client.id);
  }

  @SubscribeMessage('ride-response')
  rideResponse(
    @MessageBody()
    data: {
      accepted: boolean;
      userApiId: string;
      username: string;
      taxiName: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    const { accepted, userApiId, username, taxiName } = data;
    const taxiApiId = client.data.apiId;
    console.log(`emmiting ride response from ${taxiName} to ${userApiId}`);

    this.handleRideResponse(accepted, taxiApiId, taxiName, userApiId, username);
  }

  @SubscribeMessage('taxi-arrived')
  taxiArrived(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;
    const userSocketId = MainGateway.connections.get(userApiId)!;
    this.server.to(userSocketId).emit('taxi-arrived');
    let ride = this.activeRides.get(userApiId)!;
    ride.arrived = true;
    this.activeRides.set(userApiId, ride);
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
    this.server.to(MainGateway.connections.get(userApiId)!).emit('taxi-cancel-ride');
  }

  @SubscribeMessage('ride-completed')
  rideCompleted(@MessageBody() data: { userApiId: string }) {
    const { userApiId } = data;
    this.activeRides.delete(userApiId);
    const userSocketId = MainGateway.connections.get(userApiId)!;
    this.server.to(userSocketId).emit('ride-completed');
  }

  @SubscribeMessage('taxi-location-updated')
  taxiLocationUpdated(
    @MessageBody()
    data: { location: LatLng; userApiId: string; username: string },
    @ConnectedSocket() client: Socket
  ) {
    this.handleTaxiLocationUpdated(data, client.data.apiId);
  }

  handleTaxiLocationUpdated(data: { location: LatLng; userApiId: string; username: string }, taxiApiId: string) {
    const { location, userApiId, username } = data;
    this.taxisLocation.set(taxiApiId, {
      location: location,
      lastUpdate: new Date(),
    });

    console.log(`Line 380: ${this.taxisLocation.size}, ${this.taxisAvailable.size}`);
    if (this.taxisLocation.size == this.taxisAvailable.size) {
      this.taxisLocationLastUpdate = new Date();
      this.resolveNewRideRequest(userApiId, username);
    }
  }

  // ---------------------------------------------------- User Server-Side Only Functions  ----------------------------------------------------

  resolveNewRideRequest(userApiId: string, username: string) {
    const activeRide = this.activeRides.get(userApiId);
    if (activeRide == undefined) {
      console.log('activeRides.get(' + userApiId + ') is undefined.');
      return;
    }

    const nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      const taxiSocketId = this.taxisAvailable.get(nearestTaxi.id)!;

      activeRide.currentRequested = nearestTaxi.id;

      this.taxisAvailable.delete(nearestTaxi.id);
      this.beingRequested.set(nearestTaxi.id, taxiSocketId);

      this.server.to(taxiSocketId).emit('ride-request', activeRide.ride, userApiId, username);
      console.log('ride-request emitted to ' + nearestTaxi.id + ' !');
    } else {
      console.log('None of all taxis accept the request.');
      this.server.to(MainGateway.connections.get(userApiId)!).emit('all-taxis-reject');
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

  handleRideResponse(accepted: boolean, taxiApiId: string, taxiName: string, userApiId: string, username: string) {
    const activeRide = this.activeRides.get(userApiId)!;
    activeRide.currentRequested = undefined;
    this.beingRequested.delete(taxiApiId);

    if (activeRide == undefined) {
      console.log(`The active ride from user ${userApiId} its undefined.`);
      //this.server.to(taxiApiId).emit('notify-error-msg', `The active ride from user ${userApiId} its undefined.`);
      return;
    }

    if (accepted) {
      activeRide.taxi = taxiApiId;
      const taxiLocation = this.taxisLocation.get(taxiApiId)?.location;
      this.server.to(MainGateway.connections.get(userApiId)!).emit('taxi-confirmed-ride', taxiApiId, taxiName, taxiLocation);

      this.activeRides.set(userApiId, activeRide);
      this.taxisAvailable.delete(taxiApiId);
      this.taxisLocation.delete(taxiApiId);
    } else {
      if (activeRide.alreadyRequesteds.length == this.taxisAvailable.size) {
        this.activeRides.delete(userApiId);
        console.log('None of all taxis was requested.');
        this.server.to(MainGateway.connections.get(userApiId)!).emit('all-taxis-reject');
        return;
      }
      activeRide.alreadyRequesteds.push(taxiApiId);
      console.log(`searching new taxi, taxis availables already requested for this ride: ${activeRide.alreadyRequesteds.length}`);

      this.checkLastLocationUpdate(userApiId, username);
    }
  }

  checkLastLocationUpdate(userApiId: string, username: string) {
    if (
      this.taxisLocationLastUpdate != undefined &&
      this.taxisLocationLastUpdate > new Date(new Date().setSeconds(this.frequencyToCheckLastUpdate * -1))
    ) {
      this.resolveNewRideRequest(userApiId, username);
      return;
    }

    this.taxisLocation = new Map();

    this.taxisAvailable.forEach((taxiSocketId, taxiApiId) => {
      const activeRide = this.activeRides.get(userApiId);
      const cantRequestLocation = activeRide?.alreadyRequesteds.find((r) => r == taxiApiId) || this.beingRequested.has(taxiApiId);

      if (cantRequestLocation) return;

      console.log(`linea 368, emitting update-taxi-location to : ${taxiSocketId}`);
      this.server.to(taxiSocketId).emit('update-taxi-location', userApiId, username);
    });
  }

  // ---------------------------------------------------- Handling Users Events ----------------------------------------------------

  @SubscribeMessage('user-reconnect')
  userReconnect(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;
    const activeRide = this.activeRides.get(userApiId);
    if (activeRide != undefined && activeRide.taxi != undefined) {
      const taxiSocketId = MainGateway.connections.get(activeRide.taxi);
      if (taxiSocketId != undefined)
        this.server.to(taxiSocketId).emit('user-reconnect');
      else
        console.log('The socket id from activeRide.taxi its undefined');
    } else 
      console.log('activeRide or activeRide.taxi its undefined');
  }

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: { ride: Ride; username: string }, @ConnectedSocket() client: Socket) {
    const { ride, username } = data;
    const userApiId: string = client.data.apiId;

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
      ride: ride,
      alreadyRequesteds: [],
      currentRequested: undefined,
      taxi: undefined,
      arrived: false,
      rideId: undefined
    });

    this.checkLastLocationUpdate(userApiId, username);
  }

  @SubscribeMessage('user-cancel-ride')
  userCancelRide(@ConnectedSocket() client: Socket) {
    const userApiId = client.data.apiId;

    // If the ride doesnt exists in activeRides
    let activeRide = this.activeRides.get(userApiId);
    if (activeRide == undefined) return;

    // In case taxi've not accepted the ride yet
    const taxiBeingRequestedApiId = activeRide.currentRequested;
    if (taxiBeingRequestedApiId != undefined) {
      const taxiBeingRequestedSocketId = this.beingRequested.get(taxiBeingRequestedApiId);
      if (taxiBeingRequestedSocketId != undefined) {
        console.log(`${taxiBeingRequestedApiId} deleted from beingRequested.`);
        this.beingRequested.delete(taxiBeingRequestedApiId);
        this.server.to(taxiBeingRequestedSocketId).emit('user-cancel-ride');
      }
    }

    // In case taxi've already accepted the ride
    const taxiApiId = activeRide.taxi;
    if (taxiApiId != undefined) {
      const taxiSocketId = MainGateway.connections.get(taxiApiId);
      if (taxiSocketId != undefined) {
        console.log(`line 406 events emitted to ${taxiBeingRequestedApiId}.`);
        this.server.to(taxiSocketId).emit('user-cancel-ride');
      }
    }
    this.activeRides.delete(userApiId);
    this.server.to(client.id).disconnectSockets();
  }
}