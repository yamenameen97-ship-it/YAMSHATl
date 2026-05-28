
class SessionReplayService {
  start() {
    console.log("Session replay started");
  }

  stop() {
    console.log("Session replay stopped");
  }

  mark(eventName) {
    console.log("Replay mark:", eventName);
  }
}

export const sessionReplayService =
  new SessionReplayService();
