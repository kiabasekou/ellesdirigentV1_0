import React from 'react';
import MemberCard from './MemberCard';

const MemberGrid = ({ members, onMemberClick, onConnect, onMessage }) => {
  if (!members.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun membre trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onClick={() => onMemberClick(member)}
          onConnect={() => onConnect(member.id)}
          onMessage={() => onMessage(member.id)}
        />
      ))}
    </div>
  );
};

export default MemberGrid;