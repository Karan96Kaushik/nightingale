const SW_VERSION = '1.0.0'

self.addEventListener('message', function (event) {
  if (!event.data) return
  var port = event.ports && event.ports[0]
  if (!port) return
  if (event.data.type === 'PING') {
    port.postMessage({ type: 'PONG', version: SW_VERSION })
  }
  if (event.data.type === 'GET_STATUS') {
    port.postMessage({ type: 'STATUS', version: SW_VERSION, state: 'active' })
  }
})

self.addEventListener('push', function (event) {
  var title = 'Nightingale'
  var options = {
    body: 'Time for your 35 minutes of Spanish.',
    icon: '/favicon.svg',
    tag: 'nightingale-reminder',
    renotify: true,
    data: { dateOfArrival: Date.now(), url: '/' },
  }

  if (event.data) {
    try {
      var payload = event.data.json()
      if (payload.title) {
        title = payload.title
        delete payload.title
      }
      options = Object.assign({}, options, payload)
    } catch (e) {
      options.body = event.data.text() || 'Time for your 35 minutes of Spanish.'
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.action === 'dismiss') return

  var urlToOpen = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i]
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})
