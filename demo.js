const http = require('http');
const fs = require('fs');
const qs = require('querystring');

const da = qs.stringify({
  action: 'download',
  id: 8152, 
  uhash: 'bc133be3d97807a5efe20f09',
  'imageField.x': 77,
  'imageField.y': 40,
});
const options = {
  host: 'www.bttt.la',
  path: '/download2.php',
  post: 80,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': da.length,
  },
};

const req = http.request(options, (res) => {
  console.log(`statusCode:${res.statusCode}` );
  console.log(`headers:${res.headers}`);
  let result;
  res.on('data', (data) => {
    console.log(data);
    result += data;
  }).pipe(fs.createWriteStream(`haishanggangqinshi.torrent`));
  res.on('error', (err) => {
    console.log(err);
  })
})
req.write(da);
req.end();
req.on('error', (err) => {
  console.log(`出错${err}`);
});
