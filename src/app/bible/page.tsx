'use client';
import { FaCrown, FaBalanceScale, FaHandsHelping, FaRegLightbulb } from 'react-icons/fa';
import { GiReceiveMoney, GiTwoCoins, GiOpenTreasureChest } from 'react-icons/gi';
import { MdOutlineVolunteerActivism } from 'react-icons/md';
import { BsFillHeartFill } from 'react-icons/bs';
import { PiHandCoinsDuotone } from 'react-icons/pi';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { TbBible } from 'react-icons/tb';
import useFirework from '@/hooks/useFirework';
import FireworkEffect from '@/components/animations/FireworkEffect';
import { useRef, RefObject, MouseEvent, useState, useEffect } from 'react';

export default function BiblePage() {
  const cardRefs: RefObject<HTMLDivElement>[] = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const firework = useFirework();
  const [showTop, setShowTop] = useState(false);

  const handleCardMouseEnter = (idx: number) => (e: MouseEvent<HTMLDivElement>) => {
    const ref = cardRefs[idx].current;
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      firework.createFirework(x, y);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-[#232946] to-[#16161a] py-12 px-2 flex flex-col items-center">
      {firework.fireworks.map(fw => (
        <FireworkEffect key={fw.id} x={fw.x} y={fw.y} />
      ))}
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="위로 가기"
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 animate-fade-in"
        >
          <IoIosArrowUp className="text-2xl" />
        </button>
      )}
      <div className="max-w-3xl w-full">
        <div className="mb-24 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">성경적 자산관리</h1>
          <p className="text-gray-300 text-base md:text-lg mb-4">성경적 자산 관리를 위한 크리스챤 프로젝트 입니다.</p>
          <div className="w-full border-t border-dotted border-gray-400 mb-2" style={{ borderTopWidth: 2 }} />
        </div>
        <div className="space-y-20">
          <section
            ref={cardRefs[0]}
            onMouseEnter={handleCardMouseEnter(0)}
            className="relative bg-white/10 border border-blue-300/30 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-blue-400/40 cursor-pointer"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full p-4 shadow-lg border-4 border-white/30">
              <TbBible className="text-4xl text-white" />
            </div>
            <h2 className="mt-8 text-2xl font-bold text-blue-100 flex items-center justify-center gap-2">
              <FaCrown className="text-yellow-300" /> 자산관리의 출발점: 하나님의 주권 인정
            </h2>
            <p className="mt-4 text-lg text-blue-50">
              하나님이 모든 것의 주인이시다.<br />
              <span className="block mt-2 text-blue-200 italic">“땅과 거기 충만한 것과 세계와 그 중에 거하는 자들은 다 여호와의 것이로다”<br />(시편 24:1)</span>
            </p>
            <p className="mt-4 text-base text-blue-100 flex items-center gap-2 justify-center">
              <GiReceiveMoney className="text-green-300 text-xl" /> 우리는 청지기다.<br />
              <span className="text-blue-200 italic">“이와 같이 우리에게 구할 것은 충성이라” (고린도전서 4:2)</span>
            </p>
            <ul className="mt-6 space-y-2 text-blue-100 text-base">
              <li>• 돈은 우리의 소유가 아닌 맡겨진 자원입니다.</li>
              <li>• 소유 개념이 아니라 '청지기' 정신으로 접근해야 합니다.</li>
            </ul>
            <div className="mt-6 flex items-center gap-2 justify-center text-blue-200">
              <HiOutlineQuestionMarkCircle className="text-xl" /> 나는 하나님께서 맡기신 돈을 어떻게 관리하고 있는가?
            </div>
          </section>
          <section
            ref={cardRefs[1]}
            onMouseEnter={handleCardMouseEnter(1)}
            className="relative bg-white/10 border border-pink-300/30 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-pink-400/40 cursor-pointer"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-pink-600 rounded-full p-4 shadow-lg border-4 border-white/30">
              <FaBalanceScale className="text-4xl text-white" />
            </div>
            <h2 className="mt-8 text-2xl font-bold text-pink-100 flex items-center justify-center gap-2">
              <GiTwoCoins className="text-yellow-200" /> 돈을 섬길 것인가, 하나님을 섬길 것인가?
            </h2>
            <p className="mt-4 text-lg text-pink-50">
              두 주인을 섬길 수 없다.<br />
              <span className="block mt-2 text-pink-200 italic">“너희가 하나님과 재물을 겸하여 섬기지 못하느니라”<br />(마태복음 6:24)</span>
            </p>
            <p className="mt-4 text-base text-pink-100 flex items-center gap-2 justify-center">
              <GiOpenTreasureChest className="text-yellow-300 text-xl" /> 돈 사랑이 모든 악의 뿌리.<br />
              <span className="text-pink-200 italic">“돈을 사랑함이 일만 악의 뿌리가 되나니…” (디모데전서 6:10)</span>
            </p>
            <ul className="mt-6 space-y-2 text-pink-100 text-base text-left mx-auto max-w-md">
              <li>1. 탐욕을 멀리하라. <span className="text-pink-200">(골로새서 3:5)</span></li>
              <li>2. 절제하고 계획하라. <span className="text-pink-200">(잠언 21:5)</span></li>
              <li>3. 하나님을 의지하라. <span className="text-pink-200">(마태복음 6:33)</span></li>
            </ul>
            <div className="mt-6 flex items-center gap-2 justify-center text-pink-200">
              <HiOutlineQuestionMarkCircle className="text-xl" /> 나는 돈을 '도구'로 보고 있는가, '목표'로 보고 있는가?
            </div>
          </section>
          <section
            ref={cardRefs[2]}
            onMouseEnter={handleCardMouseEnter(2)}
            className="relative bg-white/10 border border-green-300/30 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-green-400/40 cursor-pointer"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 rounded-full p-4 shadow-lg border-4 border-white/30">
              <BsFillHeartFill className="text-4xl text-white" />
            </div>
            <h2 className="mt-8 text-2xl font-bold text-green-100 flex items-center justify-center gap-2">
              <MdOutlineVolunteerActivism className="text-yellow-200" /> 복음으로 돈을 사용하기
            </h2>
            <p className="mt-4 text-lg text-green-50">
              나눔은 사랑의 실천이다.<br />
              <span className="block mt-2 text-green-200 italic">“주는 것이 받는 것보다 복이 있다 하심을 기억하여야 할지니라”<br />(사도행전 20:35)</span>
            </p>
            <p className="mt-4 text-base text-green-100 flex items-center gap-2 justify-center">
              <PiHandCoinsDuotone className="text-yellow-300 text-xl" /> 가난한 자를 돌아보라. “선한 사업을 많이 하고 나누어 주기를 좋아하며 너그러운 자가 되게 하라” <br /> (디모데전서 6:18)
            </p>
            <ul className="mt-6 space-y-2 text-green-100 text-base text-left mx-auto max-w-md">
              <li>• 가족의 필요를 채움</li>
              <li>• 교회와 선교에 헌금</li>
              <li>• 어려운 이웃과 나눔</li>
              <li>• 미래를 준비하되 하나님을 신뢰함</li>
            </ul>
            <div className="mt-6 flex items-center gap-2 justify-center text-green-200">
              <HiOutlineQuestionMarkCircle className="text-xl" /> 나는 나의 재정을 통해 하나님 나라를 어떻게 확장하고 있는가?
            </div>
          </section>
          <section
            ref={cardRefs[3]}
            onMouseEnter={handleCardMouseEnter(3)}
            className="relative bg-white/10 border border-yellow-300/30 rounded-3xl shadow-xl p-8 flex flex-col items-center text-center backdrop-blur-md transition-shadow duration-300 hover:shadow-yellow-400/40 cursor-pointer"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full p-4 shadow-lg border-4 border-white/30">
              <FaRegLightbulb className="text-4xl text-yellow-900" />
            </div>
            <h2 className="mt-8 text-2xl font-bold text-yellow-100 flex items-center justify-center gap-2">
              <span className="text-yellow-300">📌</span> 마무리
            </h2>
            <ul className="mt-6 space-y-3 text-yellow-100 text-lg">
              <li>• 돈은 삶의 <span className="font-bold text-yellow-200">수단</span>일 뿐이지 내 인생의 <span className="font-bold text-yellow-200">주인</span>이 되어서는 안된다.</li>
              <li>• 모든 것이 하나님께로부터 왔고, 모든 것을 하나님을 위해 사용되어야 한다.</li>
              <li>• 하나님의 뜻을 따라 돈을 사용하고, 하나님이 우리의 삶 전체를 통치하신다.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
} 