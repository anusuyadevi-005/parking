const axios = require('axios');

axios.post('http://localhost:5000/api/booking/create', {
  drivingLicense: "TEST2",
  vehicleModel: "TEST2",
  numberPlate: "TEST2",
  date: "2026-03-05",
  time: "19:00",
  // simulate string from HTML input
  durationHours: "2" 
}).then(res => console.log(res.data))
  .catch(err => console.error(err.response.data));
