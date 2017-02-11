var fs = require('fs')
var request = require('request')
var apiUrl = 'https://api.github.com/gists/962807/forks?page='
var gists = []

function load (page) {
  request({
    url: apiUrl + page,
    headers: {
      'User-Agent': process.env.USER,
    },
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body)
      console.log('Downloaded: ', gists.length)
      if (data.length) {
        gists = gists.concat(data.map(function (gist) {
          if (!gist.description || !gist.description.match(/↑↑/)) {
            return {
              description: gist.description,
              user: gist.owner.login,
              url: gist.html_url,
              avatar: gist.owner.avatar_url,
              id: gist.id,
            }
          }
        }).filter(function (gist) {
          return gist
        }))
        load(page + 1)
      } else {
        fs.writeFileSync('./data.json', JSON.stringify(gists, null, 2))
      }
    }
  })
}
load(1)