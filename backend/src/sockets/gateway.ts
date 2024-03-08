/*import {
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
import { RedisService } from './redis-service';

export type activeRideType = {
    ride: Ride,
    alreadyRequesteds: string[],
    currentRequested: string,
    taxi: string,
    arrived: boolean,
}

type taxiLocationType = {
    location: LatLng,
    lastUpdate: Date,
}

// On ubuntu the port should be higher than 1024 or the user who runs the app must be root priviliged
@UseGuards(JwtAuthGuard)
@WebSocketGateway(2000, {
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
})
export class MainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private redis = new RedisService();
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
     * /
    afterInit(client: Socket) {
        client.use(SocketAuthMiddleWare() as any);
        this.redis.connectToRedis();

        this.redis.pubClient.PUBLISH('listen-sync-node', ''); //asda
        
        /*
        this.redis.subClient.SUBSCRIBE('listen-sync-node', (m) => {
            this.redis.SyncNewNode(m, this.taxisAvailable, this.activeRides);
            this.redis.subClient.SUBSCRIBE('request-sync-node', () => {
                this.redis.sendTaxisAvailable(this.taxisAvailable, this.activeRides);
            });
        });

        this.redis.pubClient.PUBLISH('request-sync-node', '');
        
        this.redis.subClient.SUBSCRIBE('active-ride-update', (m) => {
            const {activeRide, userApiId, method} = JSON.parse(m);
            if (method == 'new' || method == 'update')
                this.activeRides.set(userApiId, activeRide);
            else
                this.activeRides.delete(userApiId);
        });

        this.redis.subClient.SUBSCRIBE('new-taxi-available', (m) => {
            const {taxiApiId, taxiSocketId, location} = JSON.parse(m);
            console.log('new-taxi-available:', taxiApiId, taxiSocketId, location);
            console.log(location);
            
            this.taxisAvailable.set(taxiApiId, taxiSocketId);
            this.taxisLocation.set(taxiApiId, {
                location: location,
                lastUpdate: new Date(),
            });
        });

        this.redis.subClient.SUBSCRIBE('being-requested', (m) => {
            const {taxiApiId, taxiSocketId} = JSON.parse(m);
            this.taxisAvailable.delete(taxiApiId);
            this.beingRequested.set(taxiApiId, taxiSocketId);
        });

        this.redis.subClient.SUBSCRIBE('stop-being-requested', (m) => {
            const {taxiApiId} = JSON.parse(m);
            this.beingRequested.delete(taxiApiId);
        });

        this.redis.subClient.SUBSCRIBE('taxi-unavailable', (m) => {
            const {taxiApiId} = JSON.parse(m);
            console.log('taxi-unavailable: ', taxiApiId);
            this.taxisAvailable.delete(taxiApiId);
            this.taxisLocation.delete(taxiApiId);
        });
        * /
    }

    /**
     * @todo Handle when a user cancels a ride in the front
     * @param client 
     * /
    handleConnection(client: Socket) {
        const apiId = client.data.apiId;
        console.log(client.id, apiId);
        
        if (this.connections.has(apiId) || (client.data.role == 'taxi' && this.taxisAvailable.has(apiId))) {
            client._error(new Error('There is already a connection with the same id.'));
            return;
        }
        
        this.connections.set(apiId, client.id); // Example: ['2', 'SGS345rGDS$w']
        
        if (client.data.role == 'user') {
            this.redis.subClient.SUBSCRIBE(`taxi-cancel-ride-to-${apiId}`, (m) => {
                this.server.to(client.id).emit('taxi-cancel-ride');
            });

            this.redis.subClient.SUBSCRIBE(`location-update-for-user-${apiId}`, (m) => {
                const {location, taxiApiId} = JSON.parse(m);
                this.server.to(client.id).emit('location-update-from-taxi', location, taxiApiId);
            });

            this.redis.subClient.SUBSCRIBE(`${apiId}-ride-completed`, () => {
                this.server.to(client.id).emit('ride-completed');

            });
        }

        if (client.data.role == 'taxi') {
            let hasAnActiveRide = false;
            this.activeRides.forEach((activeRide) => {
                if (activeRide.taxi == apiId) {
                    hasAnActiveRide = true;
                    return;
                }
            });

            if (!hasAnActiveRide) {
                this.taxisAvailable.set(apiId, client.id);
                console.log('linea 170: ',client.handshake.auth.location);
                this.redis.pubClient.PUBLISH('new-taxi-available', JSON.stringify({
                    taxiApiId: apiId,
                    taxiSocketId: client.id,
                    location: client.handshake.auth.location,
                }));
            }

            this.redis.subClient.SUBSCRIBE(`${apiId}-update-taxi-location`, (m) => {
                const {userApiId, username} = JSON.parse(m);
                console.log('emitting: update-taxi-location');
                
                this.server.to(client.id).emit('update-taxi-location', userApiId, username);
            });

            this.redis.subClient.SUBSCRIBE(`ride-request-to-${apiId}`, (m) => {
                const {userApiId, username, ride} = JSON.parse(m);
                const taxiSocketId = this.connections.get(apiId)!;
                console.log(`emmiting ride request to ${taxiSocketId}`);
                this.server.to(taxiSocketId).emit('ride-request', ride, userApiId, username);
            });

            this.redis.subClient.SUBSCRIBE(`user-cancel-ride-to-${apiId}`, () => {
                this.server.to(apiId).emit('user-cancel-ride');
                // WHEN TAXI FRONTEND RECEIVE THIS EVENT WILL REQUEST THE LOCATION AND EMIT A NEW-TAXI-AVAILABLE EVENT WITH THE LOCATION
            });

            this.redis.subClient.SUBSCRIBE(`${apiId}-update-location-to-be-available`, () => {
                this.server.to(client.id).emit('update-location-to-be-available');
            });
        }
    }

    /**
     * @description Remove the ids from the maps and Unsubscribes from the redis events which was Subscribed.
     * @param client 
     * /
    handleDisconnect(client: Socket) {
        console.log(client.id);
        let apiId;
        for (const entry of this.connections.entries()) {
            if (entry[1] == client.id)
                apiId = entry[0];
        }
        if (apiId == undefined) {
            console.log('Cant find apiId: ', apiId);
            return;
        }

        this.connections.delete(apiId);

        if (client.data.role == 'user') {
            this.redis.subClient.UNSUBSCRIBE(`taxi-cancel-ride-to-${apiId}`);
            this.redis.subClient.UNSUBSCRIBE(`location-update-for-user-${apiId}`);
            this.redis.subClient.UNSUBSCRIBE(`${apiId}-ride-completed`);
        }

        if (client.data.role == 'taxi') {
            this.redis.pubClient.PUBLISH(`taxi-unavailable`, JSON.stringify({taxiApiId: apiId}));
            this.redis.subClient.UNSUBSCRIBE(`${apiId}-update-taxi-location`);
            this.redis.subClient.UNSUBSCRIBE(`ride-request-to-${apiId}`);
            this.redis.subClient.UNSUBSCRIBE(`user-cancel-ride-to-${apiId}`);
            this.redis.subClient.UNSUBSCRIBE(`${apiId}-update-location-to-be-available`);
        }
    }


// ---------------------------------------------------- Handling Taxis Events ----------------------------------------------------


    
    @SubscribeMessage('location-updated-to-be-available')
    locationUpdatedToBeAvailable(@MessageBody() data: {location: LatLng}, @ConnectedSocket() client: Socket) {
        const {location} = data;
        this.redis.pubClient.PUBLISH(`new-taxi-available`, JSON.stringify({
            taxiApiId: client.data.apiId,
            taxiSocketId: client.id,
            location: location,
        }));
    }

    @SubscribeMessage('location-update-for-user')
    locationUpdateForUser(@MessageBody() data: {location: LatLng, userApiId: string}, @ConnectedSocket() client: Socket) {
        let {location, userApiId} = data;
        console.log(location.latitude, location.longitude);

        // If user exists on this server node.
        if (this.connections.has(userApiId)) {
            this.server.to(this.connections.get(userApiId)!).emit('location-update-from-taxi', location, client.id);
            return;
        }

        let taxiApiId;
        this.connections.forEach((socketId, apiId) => {
            if (socketId == client.id) 
                taxiApiId = apiId;
        });

        if (taxiApiId == undefined) {
            console.log(`Cant find an api id searching by this socket id: ${client.id}.`);
            return;
        }

        this.redis.pubClient.PUBLISH(`location-update-for-user-${userApiId}`, JSON.stringify({
            location: location,
            taxiApiId: taxiApiId
        }));
    }

    @SubscribeMessage('ride-response')
    rideResponse(@MessageBody() data: {accepted: boolean, userApiId: string, username: string, taxiName: string}, @ConnectedSocket() client: Socket) {
        const {accepted, userApiId, username, taxiName} = data;
        const taxiApiId = client.data.apiId;

        console.log(`emmiting ride respnse from ${taxiName} to ${userApiId}`);
        
        // If user exists on this server node.
        if (this.connections.has(userApiId)) {
            this.handleRideResponse(accepted, taxiApiId, taxiName, userApiId, username);
            return;
        }

        this.redis.pubClient.PUBLISH(`ride-response-from-${taxiApiId}`, JSON.stringify({
            accepted: accepted,
            taxiName: taxiName,
            taxiApiId: taxiApiId,
            userApiId: userApiId,
            username: username
        }));
    }

    @SubscribeMessage('taxi-arrived')
    taxiArrived(@MessageBody() data: {userApiId: string}, @ConnectedSocket() client: Socket) {
        const {userApiId} = data;

        // If user exists on this server node.
        if (this.connections.has(userApiId)) {
            const userSocketId = this.connections.get(userApiId)!;
            this.server.to(userSocketId).emit('taxi-arrived');
            let ride = this.activeRides.get(userApiId)!;
            ride.arrived = true;
            this.activeRides.set(userApiId, ride);
            this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
                activeRide: this.activeRides.get(userApiId),
                userApiId: userApiId,
                method: 'update'
            }));
        } else
            this.redis.pubClient.PUBLISH(`${userApiId}-taxi-arrived`, '');
    }

    @SubscribeMessage('taxi-cancel-ride')
    taxiCancelRide(@MessageBody() data: {userApiId: string}, @ConnectedSocket() client: Socket) {
        const {userApiId} = data;

        // In the frontend it should never let the taxi cancel a ride if it has already arrived.
        if (this.activeRides.get(userApiId)?.arrived) return;

        this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
            activeRide: null,
            userApiId: userApiId,
            method: 'delete'
        }));

        // If user doesnt exists on this server node
        if (!this.connections.has(userApiId)) {
            this.redis.pubClient.PUBLISH(`taxi-cancel-ride-to-${userApiId}`, '');
            return;
        }

        this.server.to(this.connections.get(userApiId)!).emit('taxi-cancel-ride');
    }

    @SubscribeMessage('ride-completed')
    rideCompleted(@MessageBody() data: {userApiId: string}) {
        const {userApiId} = data;

        this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
            activeRide: null,
            userApiId: userApiId,
            method: 'delete'
        }));
        
        // If user exists on this server node
        if (this.connections.has(userApiId)) {
            const userSocketId = this.connections.get(userApiId)!;
            this.server.to(userSocketId).emit('ride-completed');
            return;
        }

        this.redis.pubClient.PUBLISH(`${userApiId}-ride-completed`, '');
    }

    @SubscribeMessage('taxi-location-updated')
    taxiLocationUpdated(@MessageBody() data: {location: LatLng, userApiId: string, username: string}, @ConnectedSocket() client: Socket) {
        console.log('Line 365: taxi-location-updated');
        this.handleTaxiLocationUpdated(data, client.data.apiId);
    }
    
    handleTaxiLocationUpdated(data: {location: LatLng, userApiId: string, username: string}, taxiApiId: string) {
        const {location, userApiId, username} = data;
        this.taxisLocation.set(taxiApiId, {
            location: location,
            lastUpdate: new Date(),
        });
        // If the user exists on this server node.
        if (this.connections.has(userApiId)) {
            console.log(`Line 380: ${this.taxisLocation.size}, ${this.taxisAvailable.size}`);
            if (this.taxisLocation.size == this.taxisAvailable.size) {
                this.taxisLocationLastUpdate = new Date();
                this.resolveNewRideRequest(userApiId, username);
            }
        } else {
            console.log(`Line 390 emitting: ${taxiApiId}-taxi-location-updated`);
            
            this.redis.pubClient.PUBLISH(`${taxiApiId}-taxi-location-updated`, JSON.stringify({
                location: location,
                userApiId: userApiId,
                username: username
            }));
        }
    }



// ---------------------------------------------------- User Server-Side Only Functions  ----------------------------------------------------



    resolveNewRideRequest(userApiId: string, username: string) {
        const activeRide = this.activeRides.get(userApiId);
        if (activeRide == undefined) {
            console.log('activeRides.get('+userApiId+') is undefined.');
            return;
        }

        const nearestTaxi = this.getNearestTaxi(activeRide.alreadyRequesteds, activeRide.ride);
        console.log('Line 410: ', nearestTaxi);
        if (nearestTaxi.id) {
            const taxiSocketId = this.taxisAvailable.get(nearestTaxi.id)!;
            
            activeRide.currentRequested = nearestTaxi.id;

            this.redis.pubClient.PUBLISH('being-requested', JSON.stringify({
                taxiApiId: nearestTaxi.id,
                taxiSocketId: taxiSocketId
            }));

            // If the taxi exists on this server node.
            if (this.connections.has(nearestTaxi.id)) {
                this.server.to(taxiSocketId).emit('ride-request', activeRide.ride, userApiId, username);
            } else {
                this.redis.subClient.SUBSCRIBE(`ride-response-from-${nearestTaxi.id}`, (m) => {
                    let {accepted, taxiName, taxiApiId, userApiId, username} = JSON.parse(m);
                    console.log('paso linea 425', accepted, taxiName, taxiApiId, userApiId, username);
                    this.redis.subClient.UNSUBSCRIBE(`ride-response-from-${nearestTaxi.id}`);
                    this.handleRideResponse(accepted, taxiApiId, taxiName, userApiId, username);
                });
                this.redis.pubClient.PUBLISH(`ride-request-to-${nearestTaxi.id}`, JSON.stringify({
                    userApiId: userApiId,
                    username: username,
                    ride: activeRide.ride
                }));
            }

            console.log('ride-request emitted to '+nearestTaxi.id+' !');
        } else {
            console.log('None of all taxis accept the request.');
            this.server.to(this.connections.get(userApiId)!).emit('all-taxis-reject');
            this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
                activeRide: null,
                userApiId: userApiId,
                method: 'delete'
            }));
        }
    }

    /**
     * @param alreadyRequesteds 
     * @param ride 
     * @returns An object with null values or an object with taxi values.
     * /
    getNearestTaxi(alreadyRequesteds: string[], ride: Ride) {
        let nearestTaxi: {
            id: null | string,
            distance: null | number,
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
            const alreadyRequested = alreadyRequesteds.find(r => r == id);
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
        activeRide.currentRequested = '';
        this.redis.pubClient.PUBLISH(`stop-being-requested`, JSON.stringify({taxiApiId: taxiApiId}));

        if (activeRide == undefined) {
            console.log(`The active ride from user ${userApiId} its undefined.`);
            //this.server.to(taxiApiId).emit('notify-error-msg', `The active ride from user ${userApiId} its undefined.`);
            return;
        }

        if (accepted) {
            activeRide.taxi = taxiApiId;
            const taxiLocation = this.taxisLocation.get(taxiApiId)?.location;
            this.server.to(this.connections.get(userApiId)!).emit('taxi-confirmed-ride', taxiApiId, taxiName, taxiLocation);
            
            this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
                userApiId: userApiId,
                activeRide: this.activeRides.get(userApiId),
                method: 'update'
            }));
            
            this.redis.pubClient.PUBLISH(`taxi-unavailable`, JSON.stringify({taxiApiId: taxiApiId}));
        } else {
            activeRide.alreadyRequesteds.push(taxiApiId);
            this.taxisAvailable.set(taxiApiId, this.connections.get(taxiApiId)!);
            console.log('Line 520: ', activeRide.alreadyRequesteds.length, this.taxisAvailable.size);
            
            if (activeRide.alreadyRequesteds.length == this.taxisAvailable.size) {
                this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
                    activeRide: null,
                    userApiId: userApiId,
                    method: 'delete'
                }));
                console.log('None of all taxis was requested.');
                this.server.to(this.connections.get(userApiId)!).emit('all-taxis-reject');
                return;
            }
            console.log(`searching new taxi, taxis availables already requested for this ride: ${activeRide.alreadyRequesteds.length}`);
            this.redis.pubClient.PUBLISH(`${taxiApiId}-update-location-to-be-available`, '');
            this.checkLastLocationUpdate(userApiId, username);
        }
    }

    checkLastLocationUpdate(userApiId: string, username: string) {
        // let noTaxiWasRequested = true;
        
        if (this.taxisLocationLastUpdate != undefined && this.taxisLocationLastUpdate > new Date(new Date().setSeconds(this.frequencyToCheckLastUpdate*-1))) {
            this.resolveNewRideRequest(userApiId, username);
            return;
        }
        
        this.taxisLocation = new Map();

        this.taxisAvailable.forEach((taxiSocketId, taxiApiId) => {
            const activeRide = this.activeRides.get(userApiId);
            const cantRequestLocation = activeRide?.alreadyRequesteds.find(r => r == taxiApiId) || this.beingRequested.has(taxiApiId);
            console.log(`linea 366: ${cantRequestLocation}`);
            
            if (cantRequestLocation) return;
            
            // noTaxiWasRequested = false;
            
            console.log(`Line 540: ${this.connections.has(taxiApiId)}`);
            
            // If the taxi exists on this server node.
            if (this.connections.has(taxiApiId)) {
                this.server.to(taxiSocketId).emit('update-taxi-location', userApiId, username);
                console.log('paso');
            } else {
                this.redis.subClient.SUBSCRIBE(`${taxiApiId}-taxi-location-updated`, (m) => {
                    let data = JSON.parse(m);
                    this.redis.subClient.UNSUBSCRIBE(`${taxiApiId}-taxi-location-updated`);
                    console.log(`UNSUBSCRIBE(${taxiApiId}-taxi-location-updated)`);
                    this.handleTaxiLocationUpdated(data, taxiApiId);
                });

                this.redis.pubClient.PUBLISH(`${taxiApiId}-update-taxi-location`, JSON.stringify({
                    userApiId: userApiId,
                    username: username
                }));
            }
        }); 
        
        // If noTaxiWasRequested it means that no taxis actually accepted because if it was being requested for another ride and accepted 
        // then its unavailable. On the other hand, if it didnt accept the other ride, then it will be available again and it will be setted 
        // on the taxiLocations.
        // if (noTaxiWasRequested) {
        //     console.log('None of all taxis was requested.');
        //     this.server.to(this.connections.get(userApiId)!).emit('all-taxis-reject');

        //     this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
        //         activeRide: null,
        //         userApiId: userApiId,
        //         method: 'delete'
        //     }));
        // }
    }



// ---------------------------------------------------- Handling Users Events ----------------------------------------------------



    @SubscribeMessage('new-ride')
    newRide(@MessageBody() data: {ride: Ride, username: string}, @ConnectedSocket() client: Socket) {
        const {ride, username} = data;
        const userApiId = client.data.apiId;
        
        if (!(ride && ride.origin && ride.origin.latitude && ride.origin.longitude &&
            ride.destination && ride.destination.latitude && ride.destination.longitude)) {
            console.log('The received ride from the server is undefined or has undefined attributes.');
            // TODO: handle the following event in the user frontend side.
            this.server.to(client.id).emit('notify-error-msg',
            'The received ride from the server is undefined or has undefined attributes.');
            return;
        }

        if (this.taxisAvailable.size === 0) {
            this.server.to(client.id).emit('no-taxis-available');
            return;
        }

        this.activeRides.set(userApiId, {
            ride: ride,
            alreadyRequesteds: [],
            currentRequested: '',
            taxi: '',
            arrived: false,
        });

        this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
            activeRide: this.activeRides.get(userApiId),
            userApiId: userApiId,
            method: 'new'
        }));

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
        const taxiBeingRequestedSocketId = this.beingRequested.get(taxiBeingRequestedApiId);
        if (taxiBeingRequestedSocketId != undefined) {
            // If the taxi exists on this server node.
            if (this.connections.has(taxiBeingRequestedApiId))
                this.server.to(taxiBeingRequestedSocketId).emit('user-cancel-ride');
            else 
                this.redis.pubClient.PUBLISH(`user-cancel-ride-to-${taxiBeingRequestedApiId}`, '');    
            
            this.redis.pubClient.PUBLISH('stop-being-requested', JSON.stringify({taxiApiId: taxiBeingRequestedApiId}));
            this.redis.pubClient.PUBLISH(`${taxiBeingRequestedApiId}-update-location-to-be-available`, '');
        }

        // In case taxi've already accepted the ride
        const taxiSocketId = this.connections.get(activeRide.taxi);
        if (taxiSocketId != undefined) {
            // If the taxi exists on this server node.
            if (this.connections.has(activeRide.taxi))
                this.server.to(taxiSocketId).emit('user-cancel-ride');
            else
                this.redis.pubClient.PUBLISH(`user-cancel-ride-to-${activeRide.taxi}`, '');   
            
            this.redis.pubClient.PUBLISH(`${activeRide.taxi}-update-location-to-be-available`, ''); 
        }
        
        this.redis.pubClient.PUBLISH('active-ride-update', JSON.stringify({
            activeRide: null,
            userApiId: userApiId,
            method: 'delete'
        }));
    }
}*/