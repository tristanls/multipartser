const chai = require('chai');
const expect = chai.expect;
const multipartser = require('../index');
const sinon = require('sinon');

describe('multipartser', () => {
  const boundary = 'boundary';
  let emitter;
  let partsStub;

  beforeEach(() => {
    emitter = multipartser();
    emitter.boundary(boundary);
    partsStub = sinon.stub();
    emitter.on('parts', partsStub);
  });

  it('parses simple case into parts', () => {
    const dataBlock1 =
      `\r\n--${boundary}\r\nvery very interesting data` +
      `\r\n--${boundary}--\r\n`;

    emitter.data(dataBlock1);
    emitter.end();
    expect(partsStub.firstCall.args[0]).to.eql(['\r\nvery very interesting data\r\n']);
  });

  it('parses simple case into parts with no leading whitespace chars', () => {
    const dataBlock1 =
      `--${boundary}\r\nvery very interesting data` +
      `\r\n--${boundary}--\r\n`;

    emitter.data(dataBlock1);
    emitter.end();
    expect(partsStub.firstCall.args[0]).to.eql(['\r\nvery very interesting data\r\n']);
  });

  it('parses multiparts into parts', () => {
    const dataBlock1 =
      `\r\n--${boundary}\r\nvery very interesting data` +
      `\r\n--${boundary}\r\nnot very interesting data` +
      `\r\n--${boundary}--\r\n`;

    emitter.data(dataBlock1);
    emitter.end();
    const expectedParts = [
      '\r\nvery very interesting data\r\n',
      '\r\nnot very interesting data\r\n',
    ];
    expect(partsStub.firstCall.args[0]).to.eql(expectedParts);
  });

  it('parses multiple data events into parts', () => {
    const dataBlock1 =
      `\r\n--${boundary}\r\nvery very interesting data` +
      `\r\n--${boundary}\r\nnot very`;
    const dataBlock2 = ` interesting data\r\n--${boundary}--\r\n`;

    emitter.data(dataBlock1);
    emitter.data(dataBlock2);
    emitter.end();

    expect(partsStub.firstCall.args[0]).to.eql(['\r\nvery very interesting data\r\n']);
    expect(partsStub.secondCall.args[0]).to.eql(['\r\nnot very interesting data\r\n']);
  });

  it('parses multiple data events into parts when last data event completes after the boundary', () => {
    const dataBlock1 =
      `\r\n--${boundary}\r\nvery very interesting data` +
      `\r\n--${boundary}-`;
    const dataBlock2 = `-\r\n`;

    emitter.data(dataBlock1);
    emitter.data(dataBlock2);
    emitter.end();
    expect(partsStub.firstCall.args[0]).to.eql(['\r\nvery very interesting data\r\n']);
  });

  it('parses multiple data events into parts when last data event completes the boundary', () => {
    const dataBlock1 =
      `\r\n--${boundary}\r\nvery very interesting data` +
      `\r\n--bound`;
    const dataBlock2 = `ary--\r\n`;

    emitter.data(dataBlock1);
    emitter.data(dataBlock2);
    emitter.end();
    expect(partsStub.firstCall.args[0]).to.eql(['\r\nvery very interesting data\r\n']);
  });
});
