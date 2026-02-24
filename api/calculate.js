export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  try{
    const { car, tastinessWeight, userLat, userLng, restaurantData } = req.body;

    const mpgMap = { sedan:25, suv:20, truck:15, hybrid:40 };
    const mpg = mpgMap[car]||25;
    const gasPrice = 3.5;
    const gasCostPerMile = gasPrice/mpg;

    function haversine(lat1, lon1, lat2, lon2){
      const R=3958.8; // miles
      const dLat=(lat2-lat1)*Math.PI/180;
      const dLon=(lon2-lon1)*Math.PI/180;
      const a=Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
      const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      return R*c;
    }

    const results = restaurantData.map(r => {
      const distance = haversine(userLat,userLng,r.lat,r.lng);
      const avgPlate = 20;
      const tastiness = 7;
      const gasCost = distance*gasCostPerMile;
      const totalCost = gasCost + avgPlate;
      const totalScore = (gasCost/avgPlate) - tastiness*(tastinessWeight/10);

      return {
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        distance: distance.toFixed(2),
        gasCost: gasCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        totalScore: totalScore.toFixed(2)
      };
    });

    results.sort((a,b)=>a.totalScore-b.totalScore);
    res.status(200).json(results);

  } catch(err){
    console.error(err);
    res.status(500).json({error:'Server error'});
  }
}
