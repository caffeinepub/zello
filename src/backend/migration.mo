import Map "mo:core/Map";
import List "mo:core/List";

module {
  type Attachment = {
    filename : Text;
    mimeType : Text;
    data : [Nat8];
  };

  type Participant = {
    id : Text;
    displayName : Text;
    isTyping : Bool;
    lastTypingTimestamp : ?Int;
  };

  type Message = {
    sender : Text;
    textContent : ?Text;
    attachment : ?Attachment;
    timestamp : Int;
    displayName : Text;
  };

  type Session = {
    participants : List.List<Participant>;
    messages : List.List<Message>;
    code : Text;
  };

  type Actor = {
    sessions : Map.Map<Text, Session>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
