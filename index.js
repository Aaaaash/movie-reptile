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
  sleep(3000);
  console.log(`正在抓取电影：《${tit}》`);
  const $ = cheerio.load(html);
  const count = $('.tinfo').length;
  console.log(`《${tit}》共抓取到${count}个种子文件`);
}

const sleep = (num) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, num);
  });
}
