const http = require('http');
const cheerio = require('cheerio');
const readline = require('readline');
const request = require('request');
const fs = require('fs');
const qs = require('querystring');

const BASE_API = "http://www.bttt.la";
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
  const url = `${BASE_API}/s.php?q=${movieName}&sitesearch=www.bttt.la&domains=bttt.la&hl=zh-CN&ie=UTF-8&oe=UTF-8`;
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
  if (all.length === 0) return console.log(`没有找到${decodeURI(movieName)}`);
  console.log(`关键字${decodeURI(movieName)}共找到以下电影:`)
  for(let i = 0; i < all.length; i += 1) {
    const movie = {
      title: $(all[i]).find('.tt b').text(),
      url: $(all[i]).find('.tt a').attr('href'),
      id: ($(all[i]).find('.tt a').attr('href')).replace(/[^0-9]/ig,""),
    }
    console.log(`${i + 1}==>《${$(all[i]).find('.tt b').text()}》`);
    urlArr.push(movie);
  }
  let num = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '请输入相应电影序号抓取下载地址（如不输入或输入其他字符则获取全部下载地址）：'
  });
  let downArr = [];
  num.prompt();
  num.on('line', (val) => {
    if (val === '') downArr = urlArr;
    downArr = urlArr.filter((item, index) => index !== parseInt(val));
    num.close();
  }).addListener('close', () => {
    getMovieHTML(downArr);
  });
}

// 循环请求单个电影页面
const getMovieHTML = (source) => {
  for (let i = 0; i < source.length; i += 1) {
    const url = `${BASE_API}/${source[i].url}`;
    getUrlDom(url).then((res) => {
      const results = res;
      filterMovieLink(source[i].title, source[i].title, results);
    });
  }
}

// 循环遍历单个页面html，获取每部电影种子的下载链接
const filterMovieLink = (tit, id, html) => {
  sleep(3000)
  console.log(`正在抓取电影：《${tit}》`);
  const $ = cheerio.load(html);
  const arr = $('.tinfo');
  const count = arr.length > 5 ? 5 : arr.length;
  console.log(`《${tit}》共抓取到${count}个种子文件`);
  const btArr = [];
  for (let i = 0; i < count; i += 1) {
    const btUrl = $(arr[i]).find('a').attr('href');
    const url = `${BASE_API}/${btUrl}`;
    const uhash = btUrl.substr((btUrl.indexOf('uhash=') + 6));
    getUrlDom(url).then((res) => {
      filterDownLink(tit, id, uhash, res);
    });
  }
}

const filterDownLink = (tit, id, uhash, html) => {
  const $ = cheerio.load(html);
  const downLink = $('form').attr('action');
  const url = `${BASE_API}${downLink}`;
  const data = qs.stringify({
    action: 'download',
    id: parseInt(id), 
    uhash: uhash,
    'imageField.x': 77,
    'imageField.y': 40,
  });
  const options = {
    host: 'www.bttt.la',
    path: downLink,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.length,
    },
  };
  const req = http.request(options, (res) => {
    let result;
    res.on('data', (buffer) => {
      result += buffer;
    })
    .pipe(fs.createWriteStream(`${decodeURI(movieName)}-${uhash}.torrent`));
    res.on('end', () => {
      console.log('下载成功!');
    })
    res.on('error', (err) => {
    console.log(err);
  })
  })
  req.write(data);
  req.end();
  req.on('error', (err) => {
    console.log(`出错咯：${err.message}`);
  });
}

function sleep(ms) {
  return function() {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
}
