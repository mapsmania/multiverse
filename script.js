 // Initialize MapLibre
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [2.3522, 48.8566],
      zoom: 2
    });

    const poemContainer = document.getElementById('poem-container');
    const poemPlaceholder = document.getElementById('poem-placeholder');
    
    const haikuRules = {
      "start": "$5line.ucf() % $7line % $5line2",
      "5line": "$season [light | breeze | sun | rain | winds] | flickering light | blazing sun | soft rain | howling wind | [morning | evening | twilight | afternoon] glows",
      "7line": "[sleeps deeply | wakes slowly | lingers quietly | whispers softly | breathes gently] in $town | " +
              "[walking | drifting | wandering | roaming | gliding] through $town's [quiet streets | old lanes | shadowed alleys | cobblestone paths] | " +
              "[the sun sets over | moonlight bathes] $town's [garden | rooftops | riverbank | square]",
      "5line2": "$weather | [$vp4 | $vp5]",
      "town": "this place",
      "season": "autumn | winter | spring | summer | fall",
      "tree": "[chestnut | cedar | old [gum | tea]] tree | weeping willow | ancient oak | cherry blossom |",
      "nnn": "a black rose | white daisies | sakura | rosemary | a yellow cat | crimson poppies | silent lilies | a watchful owl | a wily fox | a distant bell",
      "weather": "[cool | warm | hot | cold] [rain | breeze] | [soft | bright] sunlight",
      "vp4": "singing like birds | drifting like snow | falling like [rain | leaves | tears | stars] | glowing in the twilight | fading with the dusk | blooming in silence | whispering like the wind | shimmering like [water | silk] | soaring like [eagles | dreams] | weeping like [willows | clouds] | murmuring like [streams | secrets] | dancing like [flames | shadows] | sparkling like [frost | diamonds] | breathing like [sleep | mist] | stretching like [time | light] | rippling like [fabric | a pond]",
      "vp5": "crying like a child | whispering to the wind | echoing through the hills | resting under stars | as silent as a frozen lake"
    };

     let grammar = RiTa.grammar(haikuRules);
      
    async function fetchNearestTown(lat, lon) {
      const query = `
        [out:json];
        (
          node["place"~"town|village|city"](around:10000,${lat},${lon});
        );
        out center 1;
      `;

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query
        });

        if (!response.ok) throw new Error('Overpass API request failed');
        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
          data.elements.sort((a, b) => {
            const distA = Math.hypot(a.lat - lat, a.lon - lon);
            const distB = Math.hypot(b.lat - lat, b.lon - lon);
            return distA - distB;
          });
          return data.elements[0].tags.name || "this place";
        }
        return "this place";
      } catch (err) {
        console.error("Overpass error:", err);
        return "this place";
      }
    }

    function generateHaiku(town) {
      let cleanTown = town.replace(/[^a-zA-Z\s-']/g, '').trim();
      let capitalizedTown = cleanTown.charAt(0).toUpperCase() + cleanTown.slice(1);
      
      let currentRules = JSON.parse(JSON.stringify(haikuRules));
      currentRules.town = capitalizedTown;
      let currentGrammar = RiTa.grammar(currentRules);
      
      let haiku = currentGrammar.expand();
      return haiku.split("%").map(line => line.trim());
    }

    map.on('click', async (e) => {
      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;

      poemPlaceholder.textContent = "Fetching town and generating haiku...";

      const town = await fetchNearestTown(lat, lon);
      const haikuLines = generateHaiku(town);

      poemContainer.innerHTML = '';
      haikuLines.forEach((line, i) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'haiku-line';
        lineDiv.textContent = line;
        poemContainer.appendChild(lineDiv);
      });
    });
  
