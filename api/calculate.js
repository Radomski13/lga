export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { car, tastinessWeight, userLat, userLng, restaurantNames } = req.body;

    const mpgMap = {
      sedan: 25,
      suv: 20,
      truck: 15,
      hybrid: 40
    };

    const mpg = mpgMap[car] || 25;
    const gasPrice = 3.5;
    const gasCostPerMile = gasPrice / mpg;

    function haversine(lat1, lon1, lat2, lon2) {
      const R = 3958.8;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1*Math.PI/180) *
        Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2) *
        Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const results = [];

    for (const name of restaurantNames) {

      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(name)}&key=${process.env.GOOGLE_API_KEY}`
      );

      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) continue;

      const location = geoData.results[0].geometry.location;

      const distance = haversine(userLat, userLng, location.lat, location.lng);
      const avgPlate = 20;
      const tastiness = 7;

      const gasCost = distance * gasCostPerMile;
      const totalCost = gasCost + avgPlate;

      const score =
        (distance * gasCostPerMile) / avgPlate -
        tastiness * (tastinessWeight / 10);

      results.push({
        name,
        lat: location.lat,
        lng: location.lng,
        distance: distance.toFixed(2),
        gasCost: gasCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        score: score.toFixed(2)
      });
    }

    results.sort((a, b) => a.score - b.score);

    res.status(200).json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
