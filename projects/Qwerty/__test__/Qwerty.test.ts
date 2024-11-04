import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import { EventTicketingDAppClient } from '../contracts/clients/EventTicketingDAppClient';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: EventTicketingDAppClient;
let seller: string;

describe('EventTicketingDApp', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { algorand } = fixture;
    const { testAccount: sellerAccount } = fixture.context;
    seller = sellerAccount.addr;

    appClient = new EventTicketingDAppClient(
      {
        id: 12345,  // Replace with your actual app ID
        resolveBy: 'id',
      },
      algorand
    );
  });

  test('Create Event', async () => {
    const createResult = await appClient.createEvent({
      sender: seller,
      price: BigInt(1000000),  // 1 Algo in microAlgos
      nftAssetId: BigInt(9999),  // Sample NFT asset ID
      eventDate: BigInt(Date.now() / 1000),  // Current timestamp as event date
    });

    expect(createResult).toBeDefined();
    expect(createResult.confirmedRound).toBeGreaterThan(0);
  });

  test('Buy Ticket', async () => {
    const buyTxn = await appClient.buyTicket({
      sender: seller,
      ticketCount: BigInt(1),  // Buying one ticket
    });

    expect(buyTxn).toBeDefined();
    expect(buyTxn.confirmedRound).toBeGreaterThan(0);
  });

  test('Resell Ticket (if implemented)', async () => {
    if (typeof appClient.resellTicket === 'function') {
      const resellResult = await appClient.resellTicket({
        sender: seller,
        ticketId: BigInt(1),  // Sample ticket ID
        resalePrice: BigInt(1500000),  // Resale price
      });

      expect(resellResult).toBeDefined();
      expect(resellResult.confirmedRound).toBeGreaterThan(0);
    } else {
      console.warn('Resell ticket function not implemented in client.');
    }
  });

  test('Delete Application (if implemented)', async () => {
    if (typeof appClient.deleteApplication === 'function') {
      const deleteResult = await appClient.deleteApplication({
        sender: seller,
      });

      expect(deleteResult).toBeDefined();
      expect(deleteResult.confirmedRound).toBeGreaterThan(0);
    } else {
      console.warn('Delete application function not implemented in client.');
    }
  });
});
