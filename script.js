const form = document.getElementById('ldaForm');
const resultsDiv = document.getElementById('results');
let map, directionsService, directionsRenderer;

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!navigator.geolocation) { alert("Geolocation not supported"); return; }

  navigator.geolocation.getCurrentPosition(async pos => {

    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const car = document.getElementById('car').value;
    const tastinessWeight = Number(document.getElementById('tastiness').value);

    map = new google.maps.Map(document.getElementById('map'), { center:{lat:userLat,lng:userLng}, zoom:13 });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    new google.maps.Marker({
      position:{lat:userLat,lng:userLng},
      map,
      title:"You are here",
      icon:"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    const service = new google.maps.places.PlacesService(map);
    const request = { location:{lat:userLat,lng:userLng}, radius:5000, type:["restaurant"] };

    service.nearbySearch(request, async (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK) { 
        console.error("Places API error:", status); 
        return; 
      }

      const topRestaurants = results.slice(0, 10);
      const restaurantData = topRestaurants.map(r => ({
        name: r.name,
        lat: r.geometry.location.lat(),
        lng: r.geometry.location.lng()
      }));

      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ car, tastinessWeight, userLat, userLng, restaurantData })
      });

      const data = await res.json();

      resultsDiv.innerHTML = '<h2>Recommended Restaurants:</h2>' + data.map((r, idx) => `
        <div class="restaurant">
          <h3>${r.name}</h3>
          <p>Distance: ${r.distance} miles</p>
          <p>Estimated Gas Cost: $${r.gasCost}</p>
          <p>Total Estimated Cost: $${r.totalCost}</p>
          <p>Total Score: ${r.totalScore}</p>
        </div>
      `).join('');

      data.forEach((r, idx) => {
        const color = idx===0?"green":idx===1?"yellow":"red";
        new google.maps.Marker({
          position:{lat:r.lat,lng:r.lng},
          map,
          title:`${r.name} - Score: ${r.totalScore}`,
          icon:`http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
        });
      });

      if(data.length>0){
        const top = data[0];
        directionsService.route({
          origin:{lat:userLat,lng:userLng},
          destination:{lat:top.lat,lng:top.lng},
          travelMode:'DRIVING'
        }, (resp,status) => { if(status==='OK') directionsRenderer.setDirections(resp); });
      }
    });

  });
});
