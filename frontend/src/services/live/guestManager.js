class GuestManager {
  constructor({ maxGuests = 4 } = {}) {
    this.maxGuests = maxGuests;
    this.queue = [];
    this.coHosts = [];
  }

  requestGuestSpot(guest = {}) {
    const exists = this.queue.find((item) => item.id === guest.id) || this.coHosts.find((item) => item.id === guest.id);
    if (exists || !guest.id) return this.snapshot();
    this.queue.push({
      ...guest,
      requestedAt: Date.now(),
      status: 'pending',
    });
    return this.snapshot();
  }

  approveGuest(guestId) {
    if (this.coHosts.length >= this.maxGuests) {
      return { ...this.snapshot(), error: 'max_guests_reached' };
    }
    const guest = this.queue.find((item) => item.id === guestId);
    if (!guest) return this.snapshot();
    this.queue = this.queue.filter((item) => item.id !== guestId);
    this.coHosts.push({ ...guest, promotedAt: Date.now(), status: 'cohost' });
    return this.snapshot();
  }

  rejectGuest(guestId, reason = 'rejected') {
    this.queue = this.queue.map((item) => item.id === guestId ? { ...item, status: reason, resolvedAt: Date.now() } : item);
    return this.snapshot();
  }

  removeCoHost(guestId) {
    this.coHosts = this.coHosts.filter((item) => item.id !== guestId);
    return this.snapshot();
  }

  syncFromRoom(room = {}) {
    this.coHosts = Array.isArray(room.coHosts) ? room.coHosts : this.coHosts;
    return this.snapshot();
  }

  snapshot() {
    return {
      maxGuests: this.maxGuests,
      pendingGuests: this.queue.filter((item) => item.status === 'pending'),
      coHosts: this.coHosts,
      availableSlots: Math.max(this.maxGuests - this.coHosts.length, 0),
    };
  }
}

export const guestManager = new GuestManager();
export default guestManager;
