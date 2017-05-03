const http = require('http');
const cheerio = require('cheerio');
const readline = require('readline');

const BASE_API = "http://www.bttt.la/";
let movieName = '';

// 用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '输入需要抓取的电影标题>:'
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

// 获取页面html源码
const getUrlDom = (url) => {
  return new Promise((resolve, reject) => {
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

// 分析搜索结果页面
const filterSourceHtml = (html) => {
  const $ = cheerio.load(html);
  const count = $('.pagelist').text();
  const urlArr = [];
  let all = $('.title');
  for(let i = 0; i < all.length; i += 1) {
    const movie = {
      title: $(all[i]).find('.tt b').text(),
      url: $(all[i]).find('.tt a').attr('href'),
    }
    getMovieHTML(movie);
    urlArr.push(movie);
  }
  // getMovieHTML(urlArr);
}

// 循环请求单个电影页面
const getMovieHTML = (source) => {
  const url = `${BASE_API}${source.url}`;
  getUrlDom(url).then((res) => {
    const results = res;
    filterMovieLink(source.title, results);
  });
}

// 循环遍历单个页面html，获取每部电影种子的下载链接
const filterMovieLink = (tit, html) => {
  sleep(3000)
  console.log(`正在抓取电影：《${tit}》`);
  const $ = cheerio.load(html);
  const arr = $('.tinfo');
  const count = arr.length > 5 ? 5 : arr.length;
  console.log(`《${tit}》共抓取到${count}个种子文件`);
  const btArr = [];
  for (let i = 0; i < count; i += 1) {
    const btUrl = $(arr[i]).find('a').attr('href');
    // btArr.push(btUrl);
    const url = `${BASE_API}${btUrl}`;
    getUrlDom(url).then((res) => {
      // console.log(res);
      filterDownLink(tit, res);
    });
  }
}

const filterDownLink = (tit, html) => {
  sleep(3000);
  console.log(`正在下载种子文件...`);
  const $ = cheerio.load(html);
  const downLink = $('form').attr('action');
  console.log(downLink);
  const url = `${BASE_API}/${downLink}`;
  const data = JSON.stringify({
    action: 'download',
    id: 24987,
    uhash: '0cd8310fffa520dff7471f56',
    'imageField.x': 61,
    'imageField.y': 40,
  });
  console.log(Buffer.byteLength(data));
  const options = {
    method: 'POST',
    host: BASE_API,
    path: downLink,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
      // 'Content-Disposition': 'attachment; filename="%E3%80%90BT%E5%A4%A9%E5%A0%82%E3%80%91%E3%80%90BTtt.la%E3%80%91[720p]%E7%BB%BF%E5%B7%A8%E4%BA%BA%E5%A4%A7%E6%88%98.322.46MB.torrent"'
    },
  };
  const req = http.request(options, (res) => {
    res.on('data', (data) => {
      console.log(data);
    });
    res.on('end', () => {
      console.log('wanle');
    });
  });
  req.write(data);
  req.end();
}

function sleep(ms) {
  return function() {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
}
