import React from "react";
import ReactMarkdown from "react-markdown";
import { PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Message as MessageType, Change } from "@/types/chatTypes";

interface MessageProps {
  message: MessageType;
  handleAcceptChange: (changeId: string) => void;
  handleRejectChange: (changeId: string) => void;
  handleCardClick: (changeId: string) => void;
  insertDraftContent: (content: string, messageId: string) => void;
  handleAcceptDraft: (messageId: string) => void;
  handleRejectDraft: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = React.memo(
  ({
    message,
    handleAcceptChange,
    handleRejectChange,
    handleCardClick,
    insertDraftContent,
    handleAcceptDraft,
    handleRejectDraft,
  }) => {
    const renderMarkdownContent = (content: string) => (
      <ReactMarkdown className="prose prose-sm max-w-full break-words">
        {content}
      </ReactMarkdown>
    );

    const renderCitations = () =>
      message.citations &&
      message.citations.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-semibold mb-1">Citations:</h4>
          <ol className="list-decimal list-inside text-xs text-gray-600">
            {message.citations.map((citation, index) => (
              <li key={index} className="mb-1 break-words">
                <a
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {citation}
                </a>
              </li>
            ))}
          </ol>
        </div>
      );

    if (message.type === "text") {
      return (
        <div
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } mb-4`}
        >
          <Card
            className={`max-w-[85%] ${
              message.role === "user"
                ? "bg-black text-white"
                : "bg-[#eef0f4] text-black"
            }`}
          >
            <CardContent className="p-4">
              {message.role === "user" ? (
                <div className="break-words">{message.content}</div>
              ) : (
                <>
                  {renderMarkdownContent(message.content)}
                  {renderCitations()}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else if (message.type === "changes") {
      let changes: Change[] = [];
      try {
        changes = JSON.parse(message.content);
      } catch (error) {
        console.error("Error parsing message content:", error);
        return <div>Error displaying changes. Please try again.</div>;
      }

      return (
        <>
          {changes.map((change: Change) => (
            <Card
              key={change.id}
              className={`mb-4 ${
                change.status === "pending"
                  ? "cursor-pointer hover:shadow-md"
                  : ""
              } transition-shadow duration-200`}
              onClick={() =>
                change.status === "pending" && handleCardClick(change.id)
              }
            >
              <CardHeader>
                <CardTitle className="text-sm break-words">
                  {change.description}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {change.originalText && (
                  <div>
                    <p className="text-xs font-semibold">Original text:</p>
                    <div className="bg-gray-100 p-2 mb-2 text-sm break-words">
                      {change.originalText}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold">Suggested text by AI:</p>
                  <div className="bg-gray-100 p-2 mb-2 text-sm break-words">
                    {change.suggestedText}
                  </div>
                </div>
                {change.status === "pending" ? (
                  <div className="flex justify-start space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptChange(change.id);
                      }}
                    >
                      Accept Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRejectChange(change.id);
                      }}
                    >
                      Reject Change
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`text-center p-2 font-bold ${
                      change.status === "accepted"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {change.status === "accepted" ? "Accepted" : "Rejected"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      );
    } else if (message.type === "draft") {
      return (
        <Card className="mb-4 border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <PenTool size={16} />
              <span>Drafted Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              {renderMarkdownContent(message.content)}
            </div>
            <div className="mt-4 flex justify-start space-x-2">
              {message.status === "inserted" ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAcceptDraft(message.id)}
                  >
                    Accept Draft
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectDraft(message.id)}
                  >
                    Reject Draft
                  </Button>
                </>
              ) : message.status === "accepted" ||
                message.status === "rejected" ? (
                <div
                  className={`text-sm font-medium ${
                    message.status === "accepted"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {message.status === "accepted" ? "Accepted" : "Rejected"}
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    insertDraftContent(message.content, message.id)
                  }
                >
                  Insert into Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }
);

export default Message;