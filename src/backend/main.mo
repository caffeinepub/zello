import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Random "mo:core/Random";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Migration "migration";
import Char "mo:core/Char";

(with migration = Migration.run)
actor {
  type BackendError = { #displayNameEmpty; #participantIdEmpty };
  type CreateSessionResult = {
    #ok : Text;
    #err : BackendError;
  };

  // State
  let sessions = Map.empty<Text, Session>();

  let MAX_PARTICIPANTS = 8;
  let TYPING_INDICATOR_TIMEOUT : Int = 3_000_000_000;
  let MAX_ATTACHMENT_SIZE = 100_000_000;

  public type Participant = {
    id : Text;
    displayName : Text;
    isTyping : Bool;
    lastTypingTimestamp : ?Int;
  };

  public type Attachment = {
    filename : Text;
    mimeType : Text;
    data : [Nat8];
  };

  public type Message = {
    sender : Text;
    textContent : ?Text;
    attachment : ?Attachment;
    timestamp : Int;
    displayName : Text;
  };

  public type SessionData = {
    participants : [Participant];
    messages : [Message];
  };

  public type Session = {
    participants : List.List<Participant>;
    messages : List.List<Message>;
    code : Text;
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  // Session logic

  func generateCode() : async Text {
    let random = Random.crypto();
    let randomValue = await* random.nat64();
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let charsArray = chars.toArray();
    let firstDigit = ((randomValue / 1000) % 10).toText();
    let firstChar = charsArray[((randomValue / 500) % 26).toNat()];
    let secondChar = charsArray[((randomValue / 20) % 26).toNat()];
    let lastDigit = ((randomValue / 10) % 10).toText();
    firstDigit # firstChar.toText() # lastDigit # secondChar.toText();
  };

  public shared ({ caller }) func createSession(participantId : Text, displayName : Text) : async CreateSessionResult {
    if (displayName.isEmpty()) {
      return #err(#displayNameEmpty);
    };
    if (participantId.isEmpty()) {
      return #err(#participantIdEmpty);
    };

    let MAX_ATTEMPTS = 5;
    var attempt : Nat = 0;
    var code : Text = "";
    var success = false;

    while (attempt < MAX_ATTEMPTS and not success) {
      code := await generateCode();
      let codeExists = sessions.containsKey(code);
      if (not codeExists) {
        let newParticipant : Participant = {
          id = participantId;
          displayName;
          isTyping = false;
          lastTypingTimestamp = null;
        };
        let newParticipants = List.fromArray<Participant>([newParticipant]);
        let newMessages = List.empty<Message>();
        let newSession : Session = {
          participants = newParticipants;
          messages = newMessages;
          code;
        };
        sessions.add(code, newSession);
        success := true;
      };
      attempt += 1;
    };

    return #ok code;
  };

  public shared ({ caller }) func joinSession(code : Text, participantId : Text, displayName : Text) : async () {
    if (displayName.isEmpty()) { Runtime.trap("Display name cannot be empty") };
    if (participantId.isEmpty()) { Runtime.trap("Participant ID cannot be empty") };

    switch (sessions.get(code)) {
      case (?session) {
        if (session.participants.size() >= MAX_PARTICIPANTS) {
          Runtime.trap("Session is full. Maximum participants reached.");
        };

        for (p in session.participants.values()) {
          if (p.id == participantId) {
            Runtime.trap("Participant already in session");
          };
        };

        let newParticipant : Participant = {
          id = participantId;
          displayName;
          isTyping = false;
          lastTypingTimestamp = null;
        };
        session.participants.add(newParticipant);
      };
      case (null) { Runtime.trap("Session not found") };
    };
  };

  public shared ({ caller }) func sendMessage(
    code : Text,
    participantId : Text,
    content : ?Text,
    displayName : Text,
    attachment : ?Attachment,
  ) : () {
    if (displayName.isEmpty()) { Runtime.trap("Display name cannot be empty") };
    if (participantId.isEmpty()) { Runtime.trap("Participant ID cannot be empty") };

    if (attachment.isNull()) {
      switch (content) {
        case (null) { Runtime.trap("Message must contain text or an attachment") };
        case (?text) {
          if (text.isEmpty()) { Runtime.trap("Message must contain text or an attachment") };
        };
      };
    };

    switch (attachment) {
      case (?att) {
        if (att.data.size() > MAX_ATTACHMENT_SIZE) {
          Runtime.trap("Attachment size exceeds 100MB limit. Please compress before sending, e.g., with https://imageresizer.com/");
        };
      };
      case (null) {};
    };

    switch (sessions.get(code)) {
      case (?session) {
        let newMessage : Message = {
          sender = participantId;
          textContent = switch (content) {
            case (null) { null };
            case (?c) { if (c.isEmpty()) { null } else { content } };
          };
          timestamp = Time.now();
          displayName;
          attachment;
        };
        session.messages.add(newMessage);
      };
      case (null) { Runtime.trap("Session not found") };
    };
  };

  public shared ({ caller }) func updateTypingIndicator(code : Text, participantId : Text) : () {
    if (participantId.isEmpty()) { Runtime.trap("Participant ID cannot be empty") };

    switch (sessions.get(code)) {
      case (?session) {
        let size = session.participants.size();
        if (size > 0) {
          for (index in Nat.range(0, size)) {
            if (index < size) {
              let participantArray = session.participants.toArray();
              let participant = participantArray[index];
              if (participant.id == participantId) {
                let newParticipant : Participant = {
                  id = participant.id;
                  displayName = participant.displayName;
                  isTyping = true;
                  lastTypingTimestamp = ?Time.now();
                };
                let updatedArray = Array.tabulate(
                  participantArray.size(),
                  func(i) {
                    if (i == index) { newParticipant } else {
                      participantArray[i];
                    };
                  },
                );
                session.participants.clear();
                for (p in updatedArray.values()) {
                  session.participants.add(p);
                };
              };
            };
          };
        };
      };
      case (null) { Runtime.trap("Session not found") };
    };
  };

  public query ({ caller }) func getSessionData(code : Text) : async SessionData {
    switch (sessions.get(code)) {
      case (?session) {
        let participantsArray = session.participants.toArray();
        let participants = participantsArray.map(
          func(p) {
            let isTyping = switch (p.lastTypingTimestamp) {
              case (null) { false };
              case (?timestamp) {
                (Time.now() - timestamp) <= TYPING_INDICATOR_TIMEOUT;
              };
            };
            {
              id = p.id;
              displayName = p.displayName;
              isTyping;
              lastTypingTimestamp = p.lastTypingTimestamp;
            };
          }
        );
        let messages = session.messages.toArray().sort();
        {
          participants;
          messages;
        };
      };
      case (null) { Runtime.trap("Session not found") };
    };
  };
};
