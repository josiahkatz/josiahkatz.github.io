---
layout: "../../layouts/BlogPost.astro"
title: "Best Music of 2022"
description: "changeme"
pubDate: "Jan 19, 2023"
# heroImage: "/books.jpg"
---

<div id="embed-iframe"></div>
    <script src="https://open.spotify.com/embed-podcast/iframe-api/v1" async>
    </script>
    <script type="text/javascript">
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        let element = document.getElementById('embed-iframe');
        let options = {
            width: '100%',
            height: '200',
            uri: 'spotify:track:7tcQ0bTrFU6cbhCtekaXWh'
          };
        let callback = (EmbedController) => {
          document.querySelectorAll('ul#episodes > li > button').forEach(
            episode => {
              episode.addEventListener('click', () => {
                EmbedController.loadUri(episode.dataset.spotifyId)
              });
            })
        };
        IFrameAPI.createController(element, options, callback);
      };
    </script>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7tcQ0bTrFU6cbhCtekaXWh?utm_source=generator" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/59kXvP6MAoun6XkG2sbcMH?utm_source=generator&theme=0" width="100%" height="2030" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
