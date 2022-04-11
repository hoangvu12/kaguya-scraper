# kaguya-scraper

Main data scraper for [Kaguya](https://github.com/hoangvu12/Kaguya)


## Clone repository

To clone the repository, use the following commands:

```sh
git clone https://github.com/hoangvu12/kaguya-scraper
cd kaguya-scraper
npm install
```


## How it works?
*kaguya-scraper* is built to handle multiple anime/manga ```scrapers``` (Or we can call it ```sources```).

It will look into each source per an amount of time (you can define it in the source), scrape new data, also notify to subscribed users, send new data message to discord and push to the database. 

(Learn how to setup database here: [kaguya-database](https://github.com/hoangvu12/kaguya-database))


## How do I create a source?
You can create a source in ```src/scrapers/(anime|manga)```.

Or you can just run ```npm run cli generate```. It will generate a source for you based on the answer you give it 

Or you can look at examples at ```src/scrapers/anime/avs.ts``` and ```src/scrapers/manga/nt.ts```. These are two sources that I personally made for currently running [Kaguya](https://github.com/hoangvu12/Kaguya)

### Initialize source.
Everytime you create a new source, you have to initialize that source.

Run ```npm run cli scraper:init``` to initialize source.

#### Note: Because initialize source will scrape all the anime, it will mostly takes very long time to run. (based on how many anime/manga the source have, 2-3 hours for ~3k anime/manga).