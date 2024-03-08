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

export type activeRideType = {
  ride: Ride;
  alreadyRequesteds: string[];
  currentRequested: string | undefined;
  taxi: string | undefined;
  arrived: boolean;
};

type taxiLocationType = {
  location: LatLng;
  lastUpdate: Date;
};

// On ubuntu the port should be higher than 1024 or the user who runs the app must be root priviliged
@UseGuards(JwtAuthGuard)
@WebSocketGateway(2000, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // connections will have all the direct connections to this node, either if they are from users or taxis.
  private connections: Map<string, string> = new Map();
  private activeRides = new Map<string, activeRideType>();
  private taxisLocation = new Map<string, taxiLocationType>();
  private taxisLocationLastUpdate: Date;
  private frequencyToCheckLastUpdate = 15;
  private taxisAvailable: Map<string, string> = new Map();
  private beingRequested: Map<string, string> = new Map();

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
  }

  /**
   * @todo Handle when a user cancels a ride in the front
   * @param client
   */
  handleConnection(client: Socket) {
    const apiId = client.data.apiId;
    console.log(client.id, apiId);

    if (this.connections.has(apiId) || (client.data.role == 'taxi' && this.taxisAvailable.has(apiId))) {
      client._error(new Error('There is already a connection with the same id.'));
      return;
    }

    this.connections.set(apiId, client.id); // Example: ['2', 'SGS345rGDS$w']

    // TODO: Check if the user/taxi has an active ride when connects, not only for taxis.
    // Maybe send some notification to the user in order to knows the user cant make another ride request.

    if (client.data.role == 'taxi') {
      let hasAnActiveRide = false;
      this.activeRides.forEach((activeRide) => {
        if (activeRide.taxi == apiId) {
          hasAnActiveRide = true;
          return;
        }
      });

      if (!hasAnActiveRide) {
        this.onNewTaxiAvailable(apiId, client.id, client.handshake.auth.location);
      }
    }
  }

  /**
   * @description Remove the ids from the maps and Unsubscribes from the redis events which was Subscribed.
   * @param client
   */
  handleDisconnect(client: Socket) {
    let apiId;
    for (const entry of this.connections.entries()) {
      if (entry[1] == client.id) apiId = entry[0];
    }
    if (apiId == undefined) {
      console.log('Cant find apiId: ', apiId);
      return;
    }

    this.connections.delete(apiId);

    if (client.data.role == 'taxi') {
      this.taxisAvailable.delete(apiId);
      this.taxisLocation.delete(apiId);
      console.log(`${apiId} deleted from connections, taxisAvailable and taxisLocation.`);
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

  // ---------------------------------------------------- Handling Taxis Events ----------------------------------------------------

  @SubscribeMessage('location-updated-to-be-available')
  locationUpdatedToBeAvailable(@MessageBody() data: { location: LatLng }, @ConnectedSocket() client: Socket) {
    const { location } = data;
    this.onNewTaxiAvailable(client.data.apiId, client.id, location);
  }

  @SubscribeMessage('location-update-for-user')
  locationUpdateForUser(@MessageBody() data: { location: LatLng; userApiId: string }, @ConnectedSocket() client: Socket) {
    let { location, userApiId } = data;

    this.server.to(this.connections.get(userApiId)!).emit('location-update-from-taxi', location, client.id);
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
    const userSocketId = this.connections.get(userApiId)!;
    this.server.to(userSocketId).emit('taxi-arrived');
    let ride = this.activeRides.get(userApiId)!;
    ride.arrived = true;
    this.activeRides.set(userApiId, ride);
  }

  @SubscribeMessage('taxi-cancel-ride')
  taxiCancelRide(@MessageBody() data: { userApiId: string }, @ConnectedSocket() client: Socket) {
    const { userApiId } = data;

    // In the frontend it should never let the taxi cancel a ride if it has already arrived.
    if (this.activeRides.get(userApiId)?.arrived) return;

    this.activeRides.delete(userApiId);
    this.server.to(this.connections.get(userApiId)!).emit('taxi-cancel-ride');
  }

  @SubscribeMessage('ride-completed')
  rideCompleted(@MessageBody() data: { userApiId: string }) {
    const { userApiId } = data;
    this.activeRides.delete(userApiId);
    const userSocketId = this.connections.get(userApiId)!;
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
    console.log('Line 410: ', nearestTaxi);
    if (nearestTaxi.id) {
      const taxiSocketId = this.taxisAvailable.get(nearestTaxi.id)!;

      activeRide.currentRequested = nearestTaxi.id;

      this.taxisAvailable.delete(nearestTaxi.id);
      this.beingRequested.set(nearestTaxi.id, taxiSocketId);

      this.server.to(taxiSocketId).emit('ride-request', activeRide.ride, userApiId, username);
      console.log('ride-request emitted to ' + nearestTaxi.id + ' !');
    } else {
      console.log('None of all taxis accept the request.');
      this.server.to(this.connections.get(userApiId)!).emit('all-taxis-reject');
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
      this.server.to(this.connections.get(userApiId)!).emit('taxi-confirmed-ride', taxiApiId, taxiName, taxiLocation);

      this.activeRides.set(userApiId, activeRide);
      this.taxisAvailable.delete(taxiApiId);
      this.taxisLocation.delete(taxiApiId);
    } else {
      console.log('Line 350: ', activeRide.alreadyRequesteds.length, this.taxisAvailable.size);

      if (activeRide.alreadyRequesteds.length == this.taxisAvailable.size) {
        this.activeRides.delete(userApiId);
        console.log('None of all taxis was requested.');
        this.server.to(this.connections.get(userApiId)!).emit('all-taxis-reject');
        this.server.to(this.connections.get(taxiApiId)!).emit('update-location-to-be-available');
      }
      activeRide.alreadyRequesteds.push(taxiApiId);
      //   this.taxisAvailable.set(taxiApiId, this.connections.get(taxiApiId)!);
      console.log(`searching new taxi, taxis availables already requested for this ride: ${activeRide.alreadyRequesteds.length}`);
      this.server.to(this.connections.get(taxiApiId)!).emit('update-location-to-be-available');

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
      console.log(`linea 366: ${cantRequestLocation}`);

      if (cantRequestLocation) return;

      console.log(`linea 368, emitting update-taxi-location to : ${taxiSocketId}`);
      this.server.to(taxiSocketId).emit('update-taxi-location', userApiId, username);
    });
  }

  // ---------------------------------------------------- Handling Users Events ----------------------------------------------------

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: { ride: Ride; username: string }, @ConnectedSocket() client: Socket) {
    const { ride, username } = data;
    const userApiId = client.data.apiId;

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
        this.server.to(taxiBeingRequestedSocketId).emit('update-location-to-be-available');
      }
    }

    // In case taxi've already accepted the ride
    const taxiApiId = activeRide.taxi;
    if (taxiApiId != undefined) {
      const taxiSocketId = this.connections.get(taxiApiId);
      if (taxiSocketId != undefined) {
        console.log(`line 406 events emitted to ${taxiBeingRequestedApiId}.`);
        this.server.to(taxiSocketId).emit('user-cancel-ride');
        this.server.to(taxiSocketId).emit('update-location-to-be-available');
      }
    }

    this.activeRides.delete(userApiId);
    this.server.to(client.id).disconnectSockets();
  }
}