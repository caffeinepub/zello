import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

module {
  type OldParticipant = {
    id : Text;
    displayName : Text;
    isTyping : Bool;
    lastTypingTimestamp : ?Int;
  };

  type OldMessage = {
    sender : Text;
    content : Text;
    timestamp : Int;
    displayName : Text;
  };

  type OldSession = {
    participants : List.List<OldParticipant>;
    messages : List.List<OldMessage>;
    code : Text;
  };

  type OldActor = {
    sessions : Map.Map<Text, OldSession>;
  };

  type NewParticipant = {
    id : Text;
    displayName : Text;
    isTyping : Bool;
    lastTypingTimestamp : ?Int;
  };

  type NewAttachment = {
    filename : Text;
    mimeType : Text;
    data : [Nat8];
  };

  type NewMessage = {
    sender : Text;
    textContent : ?Text;
    attachment : ?NewAttachment;
    timestamp : Int;
    displayName : Text;
  };

  type NewSession = {
    participants : List.List<NewParticipant>;
    messages : List.List<NewMessage>;
    code : Text;
    currentVideoCallUrl : ?Text;
  };

  type NewActor = {
    sessions : Map.Map<Text, NewSession>;
  };

  public func run(old : OldActor) : NewActor {
    let newSessions = old.sessions.map<Text, OldSession, NewSession>(
      func(_code, oldSession) {
        let newParticipants = oldSession.participants.map<OldParticipant, NewParticipant>(
          func(oldParticipant) {
            {
              id = oldParticipant.id;
              displayName = oldParticipant.displayName;
              isTyping = oldParticipant.isTyping;
              lastTypingTimestamp = oldParticipant.lastTypingTimestamp;
            };
          }
        );
        let newMessages = oldSession.messages.map<OldMessage, NewMessage>(
          func(oldMessage) {
            {
              sender = oldMessage.sender;
              textContent = ?oldMessage.content;
              timestamp = oldMessage.timestamp;
              displayName = oldMessage.displayName;
              attachment = null;
            };
          }
        );
        {
          participants = newParticipants;
          messages = newMessages;
          code = oldSession.code;
          currentVideoCallUrl = null;
        };
      }
    );
    { sessions = newSessions };
  };
};
