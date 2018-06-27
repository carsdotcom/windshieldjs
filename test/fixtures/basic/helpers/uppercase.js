
const Handlebars = require('handlebars');

Handlebars.registerHelper('uppercase', function(text) {
    return text.toUpperCase();
});