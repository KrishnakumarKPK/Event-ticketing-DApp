import { Contract } from '@algorandfoundation/tealscript';

export class EventTicketingDApp extends Contract {
  organizer = GlobalStateKey<Address>();
  ticketAssetId = GlobalStateKey<AssetID>();
  ticketPrice = GlobalStateKey<uint64>();
  resaleLimit = GlobalStateKey<uint64>();
  ticketResaleCount = LocalStateKey<uint64>();

  createEvent(organizer: Address, ticketAssetId: AssetID, ticketPrice: uint64, resaleLimit: uint64): void {
    this.organizer.value = organizer;
    this.ticketAssetId.value = ticketAssetId;
    this.ticketPrice.value = ticketPrice;
    this.resaleLimit.value = resaleLimit;
  }

  optInToAsset(mbrTxn: PayTxn): void {
    assert(this.txn.sender === this.organizer.value);
    assert(!this.app.address.isOptedInToAsset(this.ticketAssetId.value));

    verifyPayTxn(mbrTxn, {
      receiver: this.app.address,
      amount: globals.minBalance + globals.assetOptInMinBalance,
    });

    sendAssetTransfer({
      xferAsset: this.ticketAssetId.value,
      assetAmount: 0,
      assetReceiver: this.app.address,
    });
  }

  buyTicket(buyerTxn: PayTxn, quantity: uint64): void {
    assert(quantity > 0);

    verifyPayTxn(buyerTxn, {
      sender: this.txn.sender,
      receiver: this.app.address,
      amount: this.ticketPrice.value * quantity,
    });

    sendAssetTransfer({
      xferAsset: this.ticketAssetId.value,
      assetAmount: quantity,
      assetReceiver: this.txn.sender,
    });

    // Initialize resale count for buyer
    this.ticketResaleCount(this.txn.sender).value = 0;
  }

  transferTicket(ticketId: uint64, newOwner: Address): void {
    let resaleCount = this.ticketResaleCount(this.txn.sender).value;
    assert(resaleCount < this.resaleLimit.value, "Resale limit exceeded");

    sendAssetTransfer({
      xferAsset: this.ticketAssetId.value,
      assetAmount: 1,
      assetReceiver: newOwner,
    });

    this.ticketResaleCount(this.txn.sender).value = resaleCount + 1;
  }

  deleteEvent(): void {
    assert(this.txn.sender === this.organizer.value);

    sendAssetTransfer({
      xferAsset: this.ticketAssetId.value,
      assetReceiver: this.organizer.value,
      assetAmount: this.app.address.assetBalance(this.ticketAssetId.value),
      assetCloseTo: this.organizer.value,
    });

    sendPayment({
      receiver: this.organizer.value,
      amount: this.app.address.balance,
      closeRemainderTo: this.organizer.value,
    });
  }
}
