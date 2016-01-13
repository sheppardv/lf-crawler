const Crawler = require("crawler"),
    he = require('he');

module.exports.crawl = function (onShow, onDrain) {
    "use strict";

    getCategories().then((tvShowsToCrawl) => {
        getTvShows(tvShowsToCrawl, onShow, onDrain)
    });
};

const getTvShows = (tvShowsToCrawl, onShow, onDrain) => {
    "use strict";
    const tvShowCrawler = new Crawler({
        maxConnections: 100,
        forceUTF8: true,
        // This will be called for each crawled page
        callback: (error, result, $) => {
            'use strict';

            console.log('Processing %s', result.request.href);

            const rows = $('.t_row');
            const tvShowNameEncoded = $('div.mid div').first().find('h1').first().html();

            let name = he.decode(tvShowNameEncoded);
            name = /\((.*)\)/.exec(name)[1];

            const tvShow = {};
            tvShow.name = he.decode(name);
            tvShow.episodes = [];

            rows.each(function (idx, el) {
                "use strict";

                try {
                    for (let episode of parseEpisodes($(el), $)) {
                        tvShow.episodes.push(episode);
                    }
                } catch (e) {
                    console.error(e);
                }
            });

            onShow(tvShow);
        },
        onDrain //no more shows
    });

    tvShowCrawler.queue(tvShowsToCrawl);
};


const getCategories = () => {
    "use strict";

    return new Promise((resolve) => {
        const categoriesUrlPart = 'http://www.lostfilm.tv/browse.php?cat=',
            categoriesCrawler = new Crawler({
                maxConnections: 10,
                forceUTF8: true,
                // This will be called for each crawled page
                callback: function (error, result, $) {
                    'use strict';

                    const catNums = [];

                    $('.mid .bb a').each((idx, el)=> {
                        const hrefCat = $(el).attr('href');
                        const catNum = /\d+$/.exec(hrefCat)[0];
                        catNums.push(catNum);
                    });

                    const tVShowsToCrawl = catNums.map((catNum)=> {
                        return (categoriesUrlPart + catNum);
                    });

                    console.info("Got %s categories.", tVShowsToCrawl.length);

                    resolve(tVShowsToCrawl);
                }
            });

        categoriesCrawler.queue('http://www.lostfilm.tv/serials.php');
    });
};

const parseEpisodes = function* ($el, $) {
    'use strict';
    const episode = {},
        nameHtml = $el.find('nobr').html();

    let match = /\((.*)\)/.exec(nameHtml);
    const name = match ? match[1] : '-';

    //this is not episode but whole eason
    if (/The Complete.*/.test(name)) {
        return;
    }

    episode.name = he.decode(name);

    const meta = $el.find('td .micro span');

    //search for season and episode numbers
    match = /(\d).*(\d)/.exec(he.decode($(meta[1]).html()));
    if (!match) {
        return;
    }
    const seasonNum = match[1];
    episode.num = match[2];

    episode.score = $(meta[2]).find('b').html();
    episode.countComments = $(meta[3]).find('b').html();
    episode.seasonNum = seasonNum;

    yield episode;
};