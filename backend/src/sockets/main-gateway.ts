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
// import { RedisService } from './redis-service';

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

/*
// On ubuntu the port should be higher than 1024 or the user who runs the app must be root priviliged
@UseGuards(JwtAuthGuard)
@WebSocketGateway(2000, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private activeRides = new Map<string, activeRideType>();
  private taxisLocation = new Map<string, taxiLocationType>();
  private taxisLocationLastUpdate = new Date();
  private frequencyToCheckLastUpdate = 5;
  private connections: Map<string, string> = new Map();
  private taxisAvailable: Map<string, string> = new Map();
  private beingRequested: Map<string, string> = new Map();


  private redis = new RedisService();

  @WebSocketServer()
  server: Server;

  afterInit(client: Socket) {
    client.use(SocketAuthMiddleWare() as any);
    this.redis.connectToRedis();
    console.log("SUBSCRIBE('listen-sync-taxis-available-to-new-node')");
    this.redis.subClient.SUBSCRIBE('listen-sync-taxis-available-to-new-node', (m) => {
      // this.redis.SyncNewNode(m, this.taxisAvailable, this.activeRides);
      console.log('To be secure: '+this.taxisAvailable);
    });
    console.log("PUBLISH('request-sync-taxis-available-to-new-node')");
    this.redis.pubClient.PUBLISH('request-sync-taxis-available-to-new-node', '');
    setTimeout(() => {
      this.redis.subClient.UNSUBSCRIBE('listen-sync-taxis-available-to-new-node');
      console.log("UNSUBSCRIBE('listen-sync-taxis-available-to-new-node')");
      console.log("SUBSCRIBE('request-sync-taxis-available-to-new-node')");
      this.redis.subClient.SUBSCRIBE('request-sync-taxis-available-to-new-node', () => {
        // this.redis.sendTaxisAvailable(this.taxisAvailable, this.activeRides);
      });
    }, 10000);

    this.redis.subClient.SUBSCRIBE('new-taxi-available', (m) => {
      let {customId, id} = JSON.parse(m);
      console.log(customId, id);
      this.taxisAvailable.set(customId, id);
      this.redis.subClient.SUBSCRIBE('taxi-unavailable', (taxiId) => {
        this.taxisAvailable.delete(taxiId);
      });
    });
    this.redis.subClient.SUBSCRIBE('being-requested', (m) => {
      let {customId, serverId} = JSON.parse(m);
      this.beingRequested.set(customId, serverId);
    });
    this.redis.subClient.SUBSCRIBE('stop-being-requested', (customId) => {
      this.beingRequested.delete(customId);
    });
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

  @SubscribeMessage('join-taxis-available')
  taxiIsAvaible(@ConnectedSocket() client: Socket) {
    // client.join(room);
    this.taxisAvailable.set(client.data.customId, client.id);
    // this.redis.subClient.UNSUBSCRIBE('new-taxi-available');
    this.redis.pubClient.PUBLISH('new-taxi-available', JSON.stringify({
      customId: client.data.customId,
      id: client.id
    }));
    this.redis.subClient.SUBSCRIBE(`${client.data.customId}-update-taxis-location`, (m) => {
      let {userId, username} = JSON.parse(m);
      this.server.to(client.id).emit('update-taxis-location', userId, username);
    });
    this.redis.subClient.SUBSCRIBE(`${client.data.customId}-ride-request`, (m) => {
      let {userId, username, ride} = JSON.parse(m);
      let serverId = this.taxisAvailable.get(client.data.customId)!;
      this.beingRequested.set(client.data.customId, serverId);
      console.log(`emmiting ride request to ${serverId}`);
      
      this.server.to(serverId).emit('ride-request', ride, userId, username);
    })
  }

  @SubscribeMessage('leave-taxis-available')
  taxiIsNotAvailable(@ConnectedSocket() client: Socket) {
    // client.leave(room);
    this.taxisAvailable.delete(client.data.customId);
    this.redis.pubClient.PUBLISH(`taxi-unavailable`, client.data.customId);
  }

  async handleTaxisLocationUpdated(data: {location: LatLng, userId: string, username?: string}, customId: string) {
    let {location, userId, username} = data;
    if (!location) return;
    this.taxisLocation.set(customId, {
      location: location,
      lastUpdate: new Date(),
    });
    // If exists on this server node.
    console.log(`linea 145: ${this.connections.has(userId)}`);
    
    if (this.connections.has(userId)) {
      if (userId != undefined && username != undefined && this.taxisLocation.size == this.taxisAvailable.size) {
        this.taxisLocationLastUpdate = new Date();
        this.resolveNewRideRequest(userId, username);
      }
    } else {
      this.redis.pubClient.PUBLISH(`${customId}-taxis-location-updated`, JSON.stringify({
        location: location,
        userId: userId,
        username: username
      }));
    }
    // this.server.to(userId).emit('location-update-from-taxi', location, client.id);
  }

  @SubscribeMessage('taxis-location-updated')
  async taxisLocationUpdated(@MessageBody() data: {location: LatLng, userId: string, username?: string}, @ConnectedSocket() client: Socket) {
    console.log(`linea 162: ${client.data.customId}`);
    
    await this.handleTaxisLocationUpdated(data, client.data.customId);
  }

  @SubscribeMessage('location-update-for-user')
  async locationUpdateForUser(@MessageBody() data: {location: LatLng, userId: string}, @ConnectedSocket() client: Socket) {
    let {location, userId} = data;
    console.log(location.latitude, location.longitude);
    if (!location) return;
    userId = this.connections.get(userId)!;
    // If exists on this server node.
    if ((await this.server.in(userId).fetchSockets()).length > 0) {
      this.server.to(userId).emit('location-update-from-taxi', location, client.id);
      return;
    }
    this.redis.pubClient.PUBLISH(`location-update-for-user-${userId}`, JSON.stringify({
      location: location,
      taxiId: client.id
    }));
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
    if (this.taxisAvailable.size > 0) {
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

  handleRideResponse(accepted: boolean, taxiId: string, taxiName: string, userId: string, username: string) {
    let activeRide = this.activeRides.get(userId)!;
    activeRide.currentRequested = '';
    this.beingRequested.delete(taxiId);
    this.redis.pubClient.PUBLISH(`stop-being-requested`, taxiId);
    if (activeRide == undefined) {
      console.log(`The active ride from user ${userId} its undefined.`);
      this.server.to(taxiId).emit('notify-error-msg', `The active ride from user ${userId} its undefined.`);
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
      this.redis.pubClient.PUBLISH(`taxi-unavailable`, taxiId);
      this.taxisAvailable.delete(taxiId);
      this.taxisLocation.delete(taxiId);
    } else {
      activeRide.alreadyRequesteds.push(taxiId);
      console.log(`searching new taxi, taxis availables: ${this.taxisLocation.size}`);
      this.checkLastLocationUpdate(userId, username);
    }
  }

  @SubscribeMessage('ride-response')
  async rideResponse(@MessageBody() data: {
    accepted: boolean,
    userId: string,
    username: string,
    taxiName: string
  }, @ConnectedSocket() client: Socket) {
    let {accepted, userId, username, taxiName} = data;
    let taxiId = client.data.customId;
    // If user not exists on this server node.
    if (!this.connections.has(userId)) {
      console.log(`emmiting ride respnse from ${taxiName} to ${userId}`);
      
      this.redis.pubClient.PUBLISH(`${taxiId}-ride-response`, JSON.stringify({
        accepted: accepted,
        taxiName: taxiName,
        taxiId: taxiId,
        userId: userId,
        username: username
      }));
    } else
      this.handleRideResponse(accepted, taxiId, taxiName, userId, username);
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
      this.redis.pubClient.PUBLISH('stop-being-requested', activeRide.currentRequested);
      this.beingRequested.delete(activeRide.currentRequested);
    }
    // In case taxi've already accepted the ride
    let taxiWhoAccepted = this.connections.get(activeRide.taxi);
    if (taxiWhoAccepted) {
      this.server.to(taxiWhoAccepted).emit('user-cancel-ride');
      // this.server.to(taxiWhoAccepted).socketsJoin('taxis-available');
      this.taxisAvailable.set(activeRide.taxi, taxiWhoAccepted)
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
    let cantRequestLocationToAnyOne = true;
    if (this.taxisLocationLastUpdate < new Date(new Date().setSeconds(this.frequencyToCheckLastUpdate*-1))) {
      this.taxisLocation = new Map();
      this.taxisAvailable.forEach(async (id, customId) => {
        let activeRide = this.activeRides.get(userId);
        let cantRequestLocation = activeRide?.alreadyRequesteds.find(r => r == customId) || this.beingRequested.has(customId);
        console.log(`linea 307: ${cantRequestLocation}`);
        
        if (cantRequestLocation) {
          return;
        }
        cantRequestLocationToAnyOne = false;
        // If exists on this server node.
        let s = await this.server.in(id).fetchSockets();
        console.log(`linea 314: ${s}`);
        
        if ((await this.server.in(id).fetchSockets()).length > 0)
          this.server.to(id).emit('update-taxis-location', userId, username);
        else {
          this.redis.subClient.SUBSCRIBE(`${customId}-taxis-location-updated`, async (m) => {
            let data = JSON.parse(m);
            await this.handleTaxisLocationUpdated(data, customId);
            console.log(`UNSUBSCRIBE(${customId}-taxis-location-updated)`)
            this.redis.subClient.UNSUBSCRIBE(`${customId}-taxis-location-updated`);
          });
          this.redis.pubClient.PUBLISH(`${customId}-update-taxis-location`, JSON.stringify({
            userId: userId,
            username: username
          }));
        }
      }); 
    } else {
      this.resolveNewRideRequest(userId, username);
    }
    
    if (cantRequestLocationToAnyOne) 
      this.resolveNewRideRequest(userId, username);
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
        // let isBeingRequested = this.server.sockets.sockets.get(id)?.rooms.has('being-requested');
        
        if (this.beingRequested.has(id)) {
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

  async resolveNewRideRequest(userId: string, username: string) {
    let activeRide = this.activeRides.get(userId);
    if (activeRide == undefined) {
      console.log('activeRides.get('+userId+') is undefined.');
      return;
    }
    let nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
    if (nearestTaxi.id) {
      let serverId = this.taxisAvailable.get(nearestTaxi.id)!;
      console.log(`sererId: ${serverId}`);
      
      activeRide.currentRequested = nearestTaxi.id;
      this.redis.pubClient.PUBLISH('being-requested', JSON.stringify({
        customId: nearestTaxi.id,
        serverId: serverId
      }));
      this.beingRequested.set(nearestTaxi.id, serverId);
      // If exists on this server node.
      if ((await this.server.in(serverId).fetchSockets()).length > 0) {
        this.server.to(serverId).emit('ride-request', activeRide.ride, userId, username);
      } else {
        this.redis.subClient.SUBSCRIBE(`${nearestTaxi.id}-ride-response`, (m) => {
          let {accepted, taxiName, taxiId, userId, username} = JSON.parse(m);
          console.log('paso linea 382', accepted, taxiName, taxiId, userId, username);
          
          this.handleRideResponse(accepted, taxiName, taxiId, userId, username);
          this.redis.subClient.UNSUBSCRIBE(`${nearestTaxi.id}-ride-response`);
        });
        this.redis.pubClient.PUBLISH(`${nearestTaxi.id}-ride-request`, JSON.stringify({
          userId: userId,
          username: username,
          ride: activeRide.ride
        }));
      }

      console.log('ride-request emitted to '+nearestTaxi.id+' !');
    } else {
      console.log('None of all taxis accept the request.');
      this.server.to(this.connections.get(userId)!).emit('all-taxis-reject');
      this.activeRides.delete(userId);
    }
  }

  @SubscribeMessage('background-test')
  backgroundTest(@MessageBody() data: {text: string}, @ConnectedSocket() client: Socket) {
    console.log(data.text);
  }
}*/