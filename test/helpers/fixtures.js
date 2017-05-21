var inquirer = require('../../lib/inquirer');

module.exports = {
  input: {
    message: 'message',
    name: 'name'
  },

  confirm: {
    message: 'message',
    name: 'name'
  },

  password: {
    message: 'message',
    name: 'name'
  },

  list: {
    message: 'message',
    name: 'name',
    choices: ['foo', new inquirer.Separator(), 'bar', 'bum']
  },

  directory: {
    message: "message",
    name: "name",
    basePath: './'
  },

  rawlist: {
    message: 'message',
    name: 'name',
    choices: ['foo', 'bar', new inquirer.Separator(), 'bum']
  },

  expand: {
    message: 'message',
    name: 'name',
    choices: [
      {key: 'a', name: 'acab'},
      new inquirer.Separator(),
      {key: 'b', name: 'bar'},
      {key: 'c', name: 'chile'},
      {key: 'd', name: 'd', value: false}
    ]
  },

  checkbox: {
    message: 'message',
    name: 'name',
    choices: [
      'choice 1',
      new inquirer.Separator(),
      'choice 2',
      'choice 3'
    ]
  },

  editor: {
    message: 'message',
    name: 'name',
    default: 'Inquirer'
  }
};
