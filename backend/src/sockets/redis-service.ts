import { RedisClientType, createClient } from 'redis';
// import { activeRideType } from './gateway';
/*
export class RedisService {
    public pubClient: RedisClientType;
    public subClient: RedisClientType;

    async connectToRedis(): Promise<void> {
        this.pubClient = createClient({ url: `redis://${process.env.REDIS_URL}` });
        this.subClient = this.pubClient.duplicate();
        await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    }

    SyncNewNode(message: string, taxisAvailable: Map<string,string>, activeRides: Map<string, activeRideType>) {
        if (message != '') {
            const {taxis, rides} = JSON.parse(message);
            // taxis.split(',').forEach((v) => {
            //     let a = v.split(' => ');
            //     taxisAvailable.set(a[0], a[1]);
            // });
            console.log(taxis);
            taxisAvailable = (taxis != null ? new Map(taxis) : taxisAvailable);
            console.log(rides);
            activeRides = (activeRides != null ? new Map(rides) : activeRides);
        }
        console.log(taxisAvailable);
        console.log("UNSUBSCRIBE('listen-sync-node')");
        this.subClient.UNSUBSCRIBE('listen-sync-node');
    }

    sendTaxisAvailable(taxisAvailable: Map<string,string>, activeRides: Map<string, activeRideType>) {
        // let taxis = '';
        // taxisAvailable.forEach((v, k) => {
        //     taxis += `${k} => ${v},`
        // });
        // taxis = taxis.slice(0, taxis.length-1);
        const t = JSON.stringify({
            taxis: (taxisAvailable.size != 0 ? taxisAvailable : null),
            rides: (activeRides.size != 0 ? activeRides : null)
        });
        console.log('To send line 41: ', t);
        this.pubClient.PUBLISH('listen-sync-node', t);
        this.subClient.UNSUBSCRIBE('request-sync-node');
    }
}*/