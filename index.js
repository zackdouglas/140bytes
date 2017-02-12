var fs = require('fs')
var request = require('request')
var apiUrl = 'https://api.github.com/gists/962807/forks?page='
var gists = []

function formatGist (gist, description) {
  return {
    description: description,
    user: gist.owner.login,
    url: gist.html_url,
    avatar: gist.owner.avatar_url,
    id: gist.id,
  } 
}
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
      console.log('Downloaded', gists.length)
      if (data.length) {
        gists = gists.concat(data.map(function (gist) {
          var description = (gist.description && !gist.description.match(/↑↑/)) ? gist.description : ''
          if (!description) {
            var packageUrl = 'https://gist.githubusercontent.com/'
              + (gist.owner ? gist.owner.login : 'anonymous')
              + '/' + gist.id + '/raw/package.json'
            return new Promise(function (resolve, reject) {
              request({
                url: packageUrl,
                headers: {
                  'User-Agent': process.env.USER,
                },
                auth: {
                  user: process.env.USER,
                  pass: process.env.PASS,
                }
              }, function (error, response, body) {
                try {
                  var data = JSON.parse(body)
                  if (data.description && !data.description.match(/short description of your entry/)) {
                    return resolve(formatGist(gist, data.description))
                  }
                } catch (err) {}
                resolve(false)
              })
            })
          } else {
            return formatGist(gist, description)
          }
        }))
        load(page + 1)
      } else {
        Promise.all(gists).then(function (gists) {
          gists = gists.filter(function (gist) {
            return gist && gist.description
          })
          console.log('Loaded', gists.length)
          fs.writeFileSync('./data.json', JSON.stringify(gists, null, 2))
        })
      }
    }
  })
}
load(1)