import React from "react";
import ReactMarkdown from "react-markdown";
import { PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Message as MessageType } from "@/types/chatTypes";
import { TrackedChanges } from "@/types/fileTypes";

interface MessageProps {
  message: MessageType;
  handleAcceptChange: () => void;
  handleRejectChange: () => void;
  handleNavigateVersion: (direction: "prev" | "next") => void;
  handleReprocessChanges: () => void;
}

const Message: React.FC<MessageProps> = React.memo(
  ({
    message,
    handleAcceptChange,
    handleRejectChange,
    handleNavigateVersion,
    handleReprocessChanges,
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

    const renderTrackedChanges = (trackedChanges: TrackedChanges) => (
      <Card className="mb-4 border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <PenTool size={16} />
            <span>Tracked Changes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div>
            <p className="text-xs font-semibold">Original text:</p>
            <div className="bg-gray-100 p-2 mb-2 text-sm break-words">
              {trackedChanges.original}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold">Suggested text by AI:</p>
            <div className="bg-gray-100 p-2 mb-2 text-sm break-words">
              {trackedChanges.versions[trackedChanges.currentVersionIndex]}
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptChange}
              >
                Accept Change
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectChange}
              >
                Reject Change
              </Button>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateVersion("prev")}
                disabled={trackedChanges.currentVersionIndex === 0}
              >
                Previous Version
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateVersion("next")}
                disabled={trackedChanges.currentVersionIndex === trackedChanges.versions.length - 1}
              >
                Next Version
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocessChanges}
              >
                Reprocess
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
    } else if (message.type === "edit" && message.trackedChanges) {
      return renderTrackedChanges(message.trackedChanges);
    }
    
    return null;
  }
);

export default Message;