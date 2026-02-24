const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.static('public'));
app.use(express.json());

const mpg = { sedan: 25, suv: 20, truck: 15, hybrid: 40 };

function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getGasPrice(lat, lng) {
  return 3.50; // Replace with real API if desired
}

app.post('/calculate', async (req, res) => {
  try {
    const { car, tastinessWeight, userLat, userLng, restaurantNames } = req.body;
    const carMpg = mpg[car.toLowerCase()] || 25;
    const gasPricePerGallon = await getGasPrice(userLat, userLng);
    const gasCostPerMile = gasPricePerGallon / carMpg;

    const results = [];

    for (const name of restaurantNames) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(name)}&key=${process.env.GOOGLE_API_KEY}`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) continue;

      const loc = geoData.results[0].geometry.location;
      const distance = haversine(userLat, userLng, loc.lat, loc.lng);

      const avgPlate = 20;
      const tastiness = 7;
      const lunchScore = (distance * gasCostPerMile) / avgPlate;
      const tastinessScore = tastiness * (tastinessWeight / 10);
      const totalScore = lunchScore - tastinessScore;
      const gasCostTotal = distance * gasCostPerMile;
      const totalCost = gasCostTotal + avgPlate;

      results.push({
        name,
        lat: loc.lat,
        lng: loc.lng,
        distance: parseFloat(distance.toFixed(2)),
        lunchScore: parseFloat(lunchScore.toFixed(2)),
        tastinessScore: parseFloat(tastinessScore.toFixed(2)),
        totalScore: parseFloat(totalScore.toFixed(2)),
        gasCostTotal: parseFloat(gasCostTotal.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgPlate,
        tastiness
      });
    }

    results.sort((a, b) => a.totalScore - b.totalScore);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
