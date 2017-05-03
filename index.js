const http = require('http');
const cheerio = require('cheerio');
const readline = require('readline');

const BASE_API = "http://www.bttt.la/";
let movieName = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '请输入name>:'
});
rl.prompt();

rl.on('line', (val) => {
  movieName = encodeURI(val);
  rl.close();
}).addListener('close', () => {
  const url = `${BASE_API}s.php?q=${movieName}&sitesearch=www.bttt.la&domains=bttt.la&hl=zh-CN&ie=UTF-8&oe=UTF-8`;
  getUrlDom(url).then((res) => {
    const results = res;
    filterSourceHtml(results);
  });
});

const getUrlDom = (url) => {
  return new Promise((resolve, reject) => {
    console.log('正在请求搜索结果...');
    http.get(url, (res) => {
      let html = '';
      res.on('data', (data) => {
        html += data;
      });
      res.on('end', () => {
        resolve(html);
      });
    }).on('error', (e) => {
      reject(e);
      console.log(`请求出错${e.message}`);
    });
  });
}

const filterSourceHtml = (html) => {
  const $ = cheerio.load(html);
  const count = $('.pagelist').text();
  console.log(`共抓取到${count}`);
}
