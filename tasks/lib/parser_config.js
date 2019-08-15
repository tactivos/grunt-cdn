module.exports = {
  htmlsplitters: [
    {
      splitters: ['<img ', '<source ', '<script', '<video ', '<audio '],
      rgx: new RegExp(/(?:src)=['"](?!\w*?:?\/\/)([^'"\{]+)['"](\s|\r|\n|\r\n|\t|.)*\/?>/i)
    },
    {
      splitters: ['<link '],
      rgx: new RegExp(/(?:href)=['"](?!\w*?:?\/\/)([^'"\{]+)['"].*\/?>/i)
    },
    // {
    //   splitters: ['<meta '],
    //   rgx: new RegExp(/(?:content)=['"](?!\w*?:?\/\/)([^'"\{]+)['"].*\/?>/i)
    // },
    {
      splitters: ['<script '],
      rgx: new RegExp(/data-main=['"](?!\w*?:?\/\/)([^'"\{]+)['"].*\/?>/i)
    }
  ],
  regcss: new RegExp(/url\(([^)]+)\)/ig),

  regcssfilter: new RegExp(/filter[\w\.\:]+\(src=['"]([^'"]+)['"]/ig),

  supportedTypes: {
    html: 'html',
    css: 'css',
    soy: 'html',
    ejs: 'html',
    hbs: 'html'
  }
};
