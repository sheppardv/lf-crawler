module.exports.crawl = function (onPage, onDrain) {
    "use strict";

    const url = 'http://www.lostfilm.tv/browse.php?cat='
        ;
    const Crawler = require("crawler"),
        he = require('he');

    const tvShow = {};

    var c = new Crawler({
        maxConnections: 10,
        forceUTF8: true,
        // This will be called for each crawled page
        callback: function (error, result, $) {
            'use strict';

            console.log('Processing %s', result.request.href);

            const rows = $('.t_row');
            const tvShowNameEncoded = $('div.mid div').first().find('h1').first().html();

            let name = he.decode(tvShowNameEncoded);
            name = /\((.*)\)/.exec(name)[1];

            tvShow.name = he.decode(name);
            tvShow.seasons = {};

            rows.each(function (idx, el) {
                "use strict";

                try {
                    const episode = {};
                    const $el = $(el);

                    const nameHtml = $el.find('nobr').html();
                    let match = /\((.*)\)/.exec(nameHtml);
                    const name = match ? match[1] : '-';
                    if (/The Complete.*/.test(name)) {
                        return;
                    }
                    episode.name = he.decode(name);

                    const meta = $el.find('td .micro span');

                    match = /(\d).*(\d)/.exec(he.decode($(meta[1]).html()));
                    if(!match){
                        return;
                    }
                    const seasonNum = match[1];
                    episode.num = match[2];

                    episode.vote = $(meta[2]).find('b').html();
                    episode.countComments = $(meta[3]).find('b').html();

                    if (!tvShow.seasons[seasonNum]) {
                        tvShow.seasons[seasonNum] = [];
                    }

                    tvShow.seasons[seasonNum].push(episode);
                } catch (e) {
                    console.error(e);
                }
            });

            onPage(tvShow);
        },
        onDrain
    });

    const categoriesCrawler = new Crawler({
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

            c.queue(catNums.map((catNum)=> {
                return (url + catNum);
            }));
        }
    });

    categoriesCrawler.queue('http://www.lostfilm.tv/serials.php');
};
