import React from 'react';
import { Text, TextProps } from 'react-native';

interface MentionTextProps extends TextProps {
  children: string;
  mentionColor?: string;
  mentionStyle?: any;
}

const MENTION_REGEX = /(@\S+)/g;

export default function MentionText({
  children,
  mentionColor = '#3B82F6',
  mentionStyle,
  style,
  ...props
}: MentionTextProps) {
  if (!children) return null;

  const parts = children.split(MENTION_REGEX);

  return (
    <Text style={style} {...props}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <Text
              key={index}
              style={[
                { color: mentionColor, fontWeight: '600' },
                mentionStyle,
              ]}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}
