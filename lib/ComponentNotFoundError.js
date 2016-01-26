function ComponentNotFoundError(message, data) {
    this.name = 'ComponentNotFoundError';
    this.message = message;
    this.data = data;
    this.stack = (new Error()).stack;
}
ComponentNotFoundError.prototype = new Error();

module.exports = ComponentNotFoundError;

