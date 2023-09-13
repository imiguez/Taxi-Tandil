export const calculateDistances = (location1, location2) => {
    const lat1 = location1.lat;
    const lon1 = location1.lon;
    const lat2 = location2.lat;
    const lon2 = location2.lon;
    // Earth radius in km
    const earthRad = 6371;

    const latitud1Rad = degToRad(lat1);
    const longitud1Rad = degToRad(lon1);
    const latitud2Rad = degToRad(lat2);
    const longitud2Rad = degToRad(lon2);

    const difLatitud = latitud2Rad - latitud1Rad;
    const difLongitud = longitud2Rad - longitud1Rad;

    // Haversine formula
    const a =
    Math.sin(difLatitud / 2) ** 2 +
    Math.cos(latitud1Rad) * Math.cos(latitud2Rad) * Math.sin(difLongitud / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRad * c;

    return distance;
}

// Convertir grados a radianes
const degToRad = (degrees) => {
    return (degrees * Math.PI) / 180;
}