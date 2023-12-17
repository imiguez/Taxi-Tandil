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
  
type activeRideType = {
  ride: Ride,
  alreadyRequesteds: string[],
  currentRequested: string,
  taxi: string,
}

type taxiLocationType = {
  location: LatLng,
  lastUpdate: Date,
}


// On ubuntu the port should be higher than 1024 or the user who runs the app must be root priviliged
@UseGuards(JwtAuthGuard)
@WebSocketGateway(2000, {
  cors: {
    origin: '*',
  },
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private activeRides = new Map<string, activeRideType>();
  private taxisLocation = new Map<string, taxiLocationType>();
  private taxisLocationLastUpdate = new Date();
  private frequencyToCheckLastUpdate = 5;

  private connections: Map<string, string> = new Map();

  @WebSocketServer()
  server: Server;
  
  afterInit(client: Socket) {
    client.use(SocketAuthMiddleWare() as any);
  }

  handleConnection(client: Socket) {
    console.log(client.id);
    this.connections.set(client.data.customId, client.id); // Example: ['2', 'SGS345rGDS$w']
  }

  handleDisconnect(client: Socket) {
    this.connections.delete(client.data.customId);
  }

  getRoomSize(room: string) {
    let r = this.server.sockets.adapter.rooms.get(room);
    if (r == undefined)
      return 0;
    return r.size;
  }

  @SubscribeMessage('join-room')
  joinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
  }

  @SubscribeMessage('leave-room')
  leaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
  }

  @SubscribeMessage('check-taxi-has-location-activated')
  checkTaxiHasLocationActivated(@ConnectedSocket() client: Socket) {
    this.server.to(client.id).emit('taxi-has-location-activated');
  }

  @SubscribeMessage('taxis-location-updated')
  taxisLocationUpdated(@MessageBody() data: {location: LatLng, userId?: string, username?: string}, @ConnectedSocket() client: Socket) {
    let {location, userId, username} = data;
    let taxiId = client.data.customId;
    this.taxisLocation.set(taxiId, {
      location: location,
      lastUpdate: new Date(),
    });
    if (userId != undefined && username != undefined && this.taxisLocation.size == this.getRoomSize('taxis-available')) {
      this.taxisLocationLastUpdate = new Date();
      this.resolveNewRideRequest(userId, username);
    }
    // this.server.to(userId).emit('location-update-from-taxi', location, client.id);
  }

  @SubscribeMessage('location-update-for-user')
  locationUpdateForUser(@MessageBody() data: {location: LatLng, userId: string}, @ConnectedSocket() client: Socket) {
    let {location, userId} = data;
    userId = this.connections.get(userId)!;
    this.server.to(userId).emit('location-update-from-taxi', location, client.id);
  }

  @SubscribeMessage('new-ride')
  newRide(@MessageBody() data: {ride: Ride, username: string}, @ConnectedSocket() client: Socket) {
    let {ride, username} = data;
    let userId = client.data.customId; // Gets the custom id.
    if (!(ride && ride.origin && ride.origin.latitude && ride.origin.longitude && 
      ride.destination && ride.destination.latitude && ride.destination.longitude)) {
      console.log('The received ride from the server is undefined or has undefined attributes.');
      // TODO: handle the following event in the user frontend side.
      this.server.to(client.id).emit('notify-error-msg', 
      'The received ride from the server is undefined or has undefined attributes.');
      return;
    }
    if (this.getRoomSize('taxis-available') > 0) {
      this.activeRides.set(userId, {
        ride: ride,
        alreadyRequesteds: [],
        currentRequested: '',
        taxi: '',
      });
      this.checkLastLocationUpdate(userId, username);
    } else 
      this.server.to(client.id).emit('no-taxis-available');
  }

  @SubscribeMessage('ride-response')
  rideResponse(@MessageBody() data: {
    accepted: boolean, 
    userId: string, 
    username: string, 
    taxiName?: string
  }, @ConnectedSocket() client: Socket) {
    let {accepted, userId, username, taxiName} = data;
    let taxiId = client.data.customId;
    this.server.to(client.id).socketsLeave('being-requested');
    let activeRide = this.activeRides.get(userId);
    if (activeRide == undefined) {
      console.log(`The active ride from user ${userId} its undefined.`);
      this.server.to(client.id).emit('notify-error-msg', `The active ride from user ${userId} its undefined.`);
      return;
    }
    if (accepted) {
      activeRide.taxi = taxiId;
      // let taxiLocation = this.taxisLocation.get(taxiId);
      // if (taxiLocation == undefined) {
      //   console.log(`The location from taxi ${client.id} its undefined.`);
      //   return;
      // }
      this.server.to(this.connections.get(userId)!).emit('taxi-confirmed-ride', taxiId, taxiName);
      this.server.to(client.id).socketsLeave('taxis-available');
      this.taxisLocation.delete(taxiId);
    } else {
      activeRide.alreadyRequesteds.push(taxiId);
      console.log(`searching new taxi, taxis availables: ${this.taxisLocation.size}`);
      this.checkLastLocationUpdate(userId, username);
    }
    activeRide.currentRequested = '';
  }

  @SubscribeMessage('taxi-arrived')
  taxiArrived(@MessageBody() data: {userId: string}, @ConnectedSocket() client: Socket) {
    let {userId} = data;
    userId = this.connections.get(userId)!;
    this.server.to(userId).emit('taxi-arrived');
  }

  @SubscribeMessage('cancel-ride')
  cancelRide(@ConnectedSocket() client: Socket) {
    let userId = client.data.customId;
    // If the ride doesnt exists in activeRides
    let activeRide = this.activeRides.get(userId);
    if (activeRide == undefined) return;
    // In case taxi've not accepted the ride yet
    let taxiBeingRequested = this.connections.get(activeRide.currentRequested);
    if (taxiBeingRequested) {
      this.server.to(taxiBeingRequested).emit('user-cancel-ride');
      this.server.to(taxiBeingRequested).socketsLeave('being-requested');
    }
    // In case taxi've already accepted the ride
    let taxiWhoAccepted = this.connections.get(activeRide.taxi);
    if (taxiWhoAccepted) {
      this.server.to(taxiWhoAccepted).emit('user-cancel-ride');
      this.server.to(taxiWhoAccepted).socketsJoin('taxis-available');
    }
    this.activeRides.delete(userId);
  }

  @SubscribeMessage('ride-completed')
  rideCompleted(@MessageBody() data: {userId: string}) {
    let {userId} = data;
    userId = this.connections.get(userId)!;
    this.server.to(userId).emit('ride-completed');
  }

  checkLastLocationUpdate(userId: string, username: string) {
    // console.log(`Update location executed? ${taxisLocationLastUpdate < new Date().setSeconds(-frequencyToCheckLastUpdate)}`);
    // if (taxisLocationLastUpdate < new Date().setSeconds(frequencyToCheckLastUpdate*-1)) {
    if (true) {
      this.taxisLocation = new Map();
      this.server.to('taxis-available').emit('update-taxis-location', userId, username);
    } else {
      this.resolveNewRideRequest(userId, username);
    }
  }

  getNearestTaxi(alreadyRequesteds: string[], ride: Ride) {
    let nearestTaxi: {
      id: null | string,
      distance: null | number,
    } = {
      id: null,
      distance: null,
    };
  
    this.taxisLocation.forEach((obj, id) => {
      if (obj.lastUpdate > new Date(new Date().setSeconds(-this.frequencyToCheckLastUpdate))){
        // CHECK IF THE TAXI IS BEING REQUESTED AT THIS MOMENT
        let isBeingRequested = this.server.sockets.sockets.get(id)?.rooms.has('being-requested');
        if (isBeingRequested) {
          console.log(`${id} is being requested.`);
        } else {
          // CHECK IF THE TAXI ALREADY WAS REQUESTED BY THIS RIDE
          let alreadyRequested = alreadyRequesteds.find(r => r == id);
          if (alreadyRequested) {
            console.log(`${id} has been requested.`);
          } else {
            let location = obj.location;
            let currentDistance = calculateDistances(ride.origin, location);
            if (nearestTaxi.distance == null || nearestTaxi.distance > currentDistance) {
              nearestTaxi ={
                id: id,
                distance: currentDistance,
              };
            }
          }
        }
      } else  {
        console.log(`Last update for ${id} was +${this.frequencyToCheckLastUpdate}s ago!`);
        // within the else it should be a re-call to update taxis location and search again the nearest
      }
    });
  
    return nearestTaxi;
  }

  resolveNewRideRequest(userId: string, username: string) {
    let activeRide = this.activeRides.get(userId);
    if (activeRide == undefined) {
      console.log('activeRides.get('+userId+') is undefined.');
      return;
    }
    let nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      this.server.to(this.connections.get(nearestTaxi.id)!).emit('ride-request', activeRide.ride, userId, username);
      activeRide.currentRequested = nearestTaxi.id;
      this.server.to(this.connections.get(nearestTaxi.id)!).socketsJoin('being-requested');
      console.log('ride-request emitted to '+nearestTaxi.id+' !');
    } else {
      console.log('None of all taxis accept the request.');
      this.server.to(this.connections.get(userId)!).emit('all-taxis-reject');
      this.activeRides.delete(userId);
    }
  }
}