/**
 * GYM Location configuration
 */
export const GYM_LOCATION = {
  lat: 12.9008,
  lng: 80.2275,
  radius: 1000,
  name: "No 9, 2nd Floor, Rajiv Gandhi Salai (Next to Accenture Company), OMR, Sholinganallur, Chennai - 600119"
};

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c * 1000; // Distance in meters
};
