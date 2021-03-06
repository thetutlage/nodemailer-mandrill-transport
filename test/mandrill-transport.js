'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

var mandrillTransport = require('../');

var packageData = require('../package.json');

describe('MandrillTransport', function() {
  it('should expose name and version', function() {
    var transport = mandrillTransport();
    expect(transport.name).to.equal('Mandrill');
    expect(transport.version).to.equal(packageData.version);
  });

  it('should fail silently when address is not defined', function() {
    var transport = mandrillTransport();
    var address = transport.formatAddress('');
    expect(address).to.be.an('array');
    expect(address.length).to.equal(0);
  });

  it('should format email address if an array is provided', function() {
    var transport = mandrillTransport();
    var address = transport.formatAddress(['Patrick Star <patrick@bikini.bottom>']);
    expect(address[0].parts).to.be.an('object');
    expect(address.length).to.equal(1);
    expect(address[0].parts.name.semantic).to.equal('Patrick Star');
    expect(address[0].parts.address.semantic).to.equal('patrick@bikini.bottom');
  });

  it('should format email address if multiple arrays are provided', function() {
    var transport = mandrillTransport();
    var address = transport.formatAddress(['Patrick Star <patrick@bikini.bottom>', 'SpongeBob SquarePants <spongebob@bikini.bottom>']);
    expect(address[0].parts).to.be.an('object');
    expect(address.length).to.equal(2);
    expect(address[0].parts.name.semantic).to.equal('Patrick Star');
    expect(address[0].parts.address.semantic).to.equal('patrick@bikini.bottom');
    expect(address[1].parts.name.semantic).to.equal('SpongeBob SquarePants');
    expect(address[1].parts.address.semantic).to.equal('spongebob@bikini.bottom');
  });

  it('should format email address if parameter is a string', function() {
    var transport = mandrillTransport();
    var address = transport.formatAddress('Patrick Star <patrick@bikini.bottom>');
    expect(address[0].parts).to.be.an('object');
    expect(address.length).to.equal(1);
    expect(address[0].parts.name.semantic).to.equal('Patrick Star');
    expect(address[0].parts.address.semantic).to.equal('patrick@bikini.bottom');
  });

  describe('#send', function(done) {
    var transport = mandrillTransport();
    var client = transport.mandrillClient;

    var payload = {
      data: {
        to: 'SpongeBob SquarePants <spongebob@bikini.bottom>, Patrick Star <patrick@bikini.bottom>',
        cc: 'Squidward Tentacles <squidward@bikini.bottom>, Sandy Cheeks <sandy@bikini.bottom>',
        bcc: 'Mr. Krabs <krabs@bikini.bottom>, Plankton <plankton@bikini.bottom>',
        from: 'Gary the Snail <gary@bikini.bottom>',
        subject: 'Meow...',
        text: 'Meow!',
        html: '<p>Meow!</p>'
      }
    };

    var status;
    var stub = sinon.stub(client.messages, 'send', function(data, resolve) {
      var message = data.message;
      expect(message).to.exist;
      expect(message.to.length).to.equal(6);
      expect(message.to[0].name).to.equal('SpongeBob SquarePants');
      expect(message.to[0].email).to.equal('spongebob@bikini.bottom');
      expect(message.to[1].name).to.equal('Patrick Star');
      expect(message.to[1].email).to.equal('patrick@bikini.bottom');
      expect(message.to[2].type).to.equal('cc');
      expect(message.to[2].name).to.equal('Squidward Tentacles');
      expect(message.to[2].email).to.equal('squidward@bikini.bottom');
      expect(message.to[3].type).to.equal('cc');
      expect(message.to[3].name).to.equal('Sandy Cheeks');
      expect(message.to[3].email).to.equal('sandy@bikini.bottom');
      expect(message.to[4].type).to.equal('bcc');
      expect(message.to[4].name).to.equal('Mr. Krabs');
      expect(message.to[4].email).to.equal('krabs@bikini.bottom');
      expect(message.to[5].type).to.equal('bcc');
      expect(message.to[5].name).to.equal('Plankton');
      expect(message.to[5].email).to.equal('plankton@bikini.bottom');
      expect(message.from_name).to.equal('Gary the Snail');
      expect(message.from_email).to.equal('gary@bikini.bottom');
      expect(message.subject).to.equal('Meow...');
      expect(message.text).to.equal('Meow!');
      expect(message.html).to.equal('<p>Meow!</p>');

      resolve([{ _id: 'fake-id', status: status }]);
    });

    after(function() {
      stub.restore();
    });

    afterEach(function() {
      stub.reset();
    });

    it('sent response', function(done) {
      status = 'sent';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('queued response', function(done) {
      status = 'queued';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('scheduled response', function(done) {
      status = 'scheduled';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(1);
        expect(info.rejected.length).to.equal(0);
        expect(info.messageId).to.equal('fake-id');
        done();
      });
    });

    it('invalid response', function(done) {
      status = 'invalid';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('rejected response', function(done) {
      status = 'rejected';
      transport.send(payload, function(err, info) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        expect(info.accepted.length).to.equal(0);
        expect(info.rejected.length).to.equal(1);
        done();
      });
    });

    it('can override Mandrill API options', function(done) {
      payload.data.mandrillOptions = {
        message: {
          preserve_recipients: true
        }
      };

      stub.restore();
      stub = sinon.stub(client.messages, 'send', function(data, resolve) {
        expect(data.message.preserve_recipients).to.be.true;
        resolve([{ _id: 'fake-id', status: 'sent' }]);
      });

      transport.send(payload, function(err) {
        expect(err).to.not.exist;
        expect(stub.calledOnce).to.be.true;
        done();
      });
    });
  });
});
