const assert = require('assert');
// eslint-disable-next-line import/no-unresolved
const NonceTracker = require('../dist');
const MockTxGen = require('./lib/mock-tx-gen');

const providerResultStub = {};

describe('Nonce Tracker', function () {
  let nonceTracker, pendingTxs, confirmedTxs;

  describe('#getNonceLock', function () {
    describe('with 3 confirmed and 1 pending', function () {
      beforeEach(function () {
        const txGen = new MockTxGen();
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 3 });
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 1 });
        nonceTracker = generateNonceTrackerWith(
          pendingTxs,
          confirmedTxs,
          '0x1',
        );
      });

      it('should return 4', async function () {
        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '4',
          `nonce should be 4 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });

      it('should use localNonce if network returns a nonce lower then a confirmed tx in state', async function () {
        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(nonceLock.nextNonce, '4', 'nonce should be 4');
        await nonceLock.releaseLock();
      });
    });

    describe('sentry issue 476304902', function () {
      it('should return 9', async function () {
        const txGen = new MockTxGen();
        pendingTxs = txGen.generate(
          { status: 'submitted' },
          {
            fromNonce: 3,
            count: 29,
          },
        );
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x3');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '32',
          `nonce should be 32 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('issue 3670', function () {
      it('should return 9', async function () {
        const txGen = new MockTxGen();
        pendingTxs = txGen.generate(
          { status: 'submitted' },
          {
            fromNonce: 6,
            count: 3,
          },
        );
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x6');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '9',
          `nonce should be 9 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('with no previous txs', function () {
      it('should return 0', async function () {
        nonceTracker = generateNonceTrackerWith([], []);

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '0',
          `nonce should be 0 returned ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('with multiple previous txs with same nonce', function () {
      it('should return nonce after those', async function () {
        const txGen = new MockTxGen();
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 1 });
        pendingTxs = txGen.generate(
          {
            status: 'submitted',
            txParams: { nonce: '0x01' },
          },
          { count: 5 },
        );

        nonceTracker = generateNonceTrackerWith(
          pendingTxs,
          confirmedTxs,
          '0x0',
        );

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '2',
          `nonce should be 2 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('when local confirmed count is higher than network nonce', function () {
      it('should return nonce after those', async function () {
        const txGen = new MockTxGen();
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 3 });
        nonceTracker = generateNonceTrackerWith([], confirmedTxs, '0x1');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '3',
          `nonce should be 3 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('when local pending count is higher than other metrics', function () {
      it('should return nonce after those', async function () {
        const txGen = new MockTxGen();
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 2 });
        nonceTracker = generateNonceTrackerWith(pendingTxs, []);

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '2',
          `nonce should be 2 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('when provider nonce is higher than other metrics', function () {
      it('should return nonce after those', async function () {
        const txGen = new MockTxGen();
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 2 });
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x05');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '5',
          `nonce should be 5 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('when there are some pending nonces below the remote one and some over.', function () {
      it('should return nonce after those', async function () {
        const txGen = new MockTxGen();
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 5 });
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x03');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '5',
          `nonce should be 5 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('when there are pending nonces non sequentially over the network nonce.', function () {
      it('should return nonce after network nonce', async function () {
        const txGen = new MockTxGen();
        txGen.generate({ status: 'submitted' }, { count: 5 });
        // 5 over that number
        pendingTxs = txGen.generate({ status: 'submitted' }, { count: 5 });
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x00');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '0',
          `nonce should be 0 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('When all three return different values', function () {
      it('should return nonce after network nonce', async function () {
        const txGen = new MockTxGen();
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 10 });
        pendingTxs = txGen.generate(
          {
            status: 'submitted',
            nonce: 100,
          },
          { count: 1 },
        );

        // 0x32 is 50 in hex:
        nonceTracker = generateNonceTrackerWith(
          pendingTxs,
          confirmedTxs,
          '0x32',
        );

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '50',
          `nonce should be 50 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });

    describe('Faq issue 67', function () {
      it('should return nonce after network nonce', async function () {
        const txGen = new MockTxGen();
        confirmedTxs = txGen.generate({ status: 'confirmed' }, { count: 64 });
        pendingTxs = txGen.generate(
          {
            status: 'submitted',
          },
          { count: 10 },
        );
        // 0x40 is 64 in hex:
        nonceTracker = generateNonceTrackerWith(pendingTxs, [], '0x40');

        this.timeout(15000);
        const nonceLock = await nonceTracker.getNonceLock(
          '0x7d3517b0d011698406d6e0aed8453f0be2697926',
        );
        assert.equal(
          nonceLock.nextNonce,
          '74',
          `nonce should be 74 got ${nonceLock.nextNonce}`,
        );
        await nonceLock.releaseLock();
      });
    });
  });
});

function generateNonceTrackerWith(pending, confirmed, providerStub = '0x0') {
  const getPendingTransactions = () => pending;
  const getConfirmedTransactions = () => confirmed;
  providerResultStub.result = providerStub;
  const provider = {
    sendAsync: (_, cb) => {
      cb(undefined, providerResultStub);
    },
  };
  const blockTracker = {
    getCurrentBlock: () => '0x11b568',
    getLatestBlock: async () => '0x11b568',
  };
  return new NonceTracker({
    provider,
    blockTracker,
    getPendingTransactions,
    getConfirmedTransactions,
  });
}
