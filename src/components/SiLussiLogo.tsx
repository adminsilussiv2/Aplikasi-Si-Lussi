import React from 'react';

interface SiLussiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'dark' | 'light';
}

function buildSPath(x0: number): string {
  return [
    `M ${x0 + 62} 1438`,
    `C ${x0 + 86} 1438 ${x0 + 106} 1445 ${x0 + 118} 1455`,
    `L ${x0 + 126} 1488`,
    `C ${x0 + 104} 1472 ${x0 + 82} 1466 ${x0 + 62} 1466`,
    `C ${x0 + 46} 1466 ${x0 + 38} 1472 ${x0 + 38} 1481`,
    `C ${x0 + 38} 1491 ${x0 + 50} 1496 ${x0 + 76} 1502`,
    `C ${x0 + 110} 1510 ${x0 + 126} 1526 ${x0 + 126} 1552`,
    `C ${x0 + 126} 1581 ${x0 + 100} 1600 ${x0 + 60} 1600`,
    `C ${x0 + 36} 1600 ${x0 + 16} 1593 ${x0 + 0} 1582`,
    `L ${x0 + 0} 1546`,
    `C ${x0 + 20} 1563 ${x0 + 42} 1571 ${x0 + 60} 1571`,
    `C ${x0 + 78} 1571 ${x0 + 88} 1564 ${x0 + 88} 1553`,
    `C ${x0 + 88} 1542 ${x0 + 76} 1536 ${x0 + 50} 1530`,
    `C ${x0 + 16} 1522 ${x0 + 2} 1506 ${x0 + 2} 1480`,
    `C ${x0 + 2} 1453 ${x0 + 26} 1438 ${x0 + 62} 1438 Z`,
  ].join(' ');
}

export const SiLussiLogo: React.FC<SiLussiLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: { width: 44, height: 71 },
    md: { width: 62, height: 100 },
    lg: { width: 96, height: 155 },
    xl: { width: 124, height: 200 },
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 1000 1612"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo SI-LUSSI"
      >
        {/* 1. Outer-Right Azure Crescent & Bottom Fin (#1B70BA) */}
        <path
          d="M865 595C955 678 1000 778 1000 885C1000 1085 838 1248 585 1248C425 1248 282 1185 182 1102C255 1076 332 1082 418 1120C548 1178 738 1172 855 1068C942 988 965 862 942 785C932 710 908 642 865 595Z"
          fill="#1B70BA"
        />

        {/* 2. Top Dark Navy S-Arch & Pointed Beak (#0C2B5E) */}
        <path
          d="M2 232C2 96 175 0 415 0L606 0L860 294C715 190 540 106 392 106C235 106 146 178 146 260C146 355 265 395 465 435C665 475 790 525 865 595C908 642 932 710 942 785C890 685 755 585 462 515C215 456 22 368 2 232Z"
          fill="#0C2B5E"
        />

        {/* 3. Deep Royal Blue Inner Right Crescent (#114D97) */}
        <path
          d="M835 655C918 728 955 852 912 975C865 1108 695 1165 505 1122C462 1112 425 1096 395 1076L525 1066C645 1086 775 1048 835 952C885 872 872 768 805 702L835 655Z"
          fill="#114D97"
        />

        {/* 4. Center Breaking Wave Crest (#3E81B5) */}
        <path
          d="M368 854C412 902 468 922 512 902C545 886 548 848 518 834C496 824 478 838 484 858C468 822 488 768 542 768C598 768 636 812 632 872C628 918 595 954 548 972C602 978 652 958 672 898L765 948C718 1012 622 1042 518 1018C438 998 388 928 368 854Z"
          fill="#3E81B5"
        />

        {/* 5. Main Medium-Cobalt S-Belly & Wave Curl (#2063A7) */}
        <path
          d="M2 232C22 368 215 456 462 515C640 558 765 602 835 655C868 702 872 752 858 795C832 732 775 712 732 742C705 762 702 798 718 825C732 798 768 798 788 828C812 862 802 918 765 948C725 978 675 955 672 898C670 858 692 828 686 785C672 675 525 598 312 522C105 448 12 365 2 232Z"
          fill="#2063A7"
        />

        {/* 6. Lower-Left Sky-Steel Blue Spiral Wave (#5693BC) */}
        <path
          d="M525 1066L425 1102C352 1076 298 1016 262 932C228 852 182 832 136 854C92 876 78 938 98 976C118 1010 162 1008 178 976C192 946 184 910 162 892C202 902 232 942 226 992C220 1042 185 1072 138 1072C62 1072 0 996 0 886C0 776 58 692 142 692C212 692 258 762 302 862C355 976 422 1046 525 1066Z"
          fill="#5693BC"
        />

        {/* 7. Official Beveled SI-LUSSI Wordmark (#051329) */}
        <g fill="#051329">
          {/* S (1) */}
          <path d={buildSPath(32)} />

          {/* I (1) */}
          <polygon points="184,1466 224,1438 224,1598 184,1598" />

          {/* Hyphen (-) */}
          <rect x="248" y="1524" width="60" height="30" />

          {/* L */}
          <polygon points="334,1438 374,1466 374,1562 436,1562 454,1598 334,1598" />

          {/* U (both stems beveled inward at top) */}
          <path d="M468 1438L508 1466L508 1532C508 1554 520 1566 536 1566C552 1566 564 1554 564 1532L564 1466L604 1438L604 1534C604 1574 576 1600 536 1600C496 1600 468 1574 468 1534L468 1438Z" />

          {/* S (2) */}
          <path d={buildSPath(626)} />

          {/* S (3) */}
          <path d={buildSPath(762)} />

          {/* I (2) */}
          <polygon points="908,1466 948,1438 948,1598 908,1598" />
        </g>
      </svg>
    </div>
  );
};

export const SiLussiBrandMark: React.FC<{
  variant?: 'dark' | 'light';
  compact?: boolean;
}> = ({ variant = 'dark', compact = false }) => {
  const isLight = variant === 'light';
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shrink-0 shadow-xs ring-1 ring-slate-200/80">
        <SiLussiLogo size="sm" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div
            className={`font-display text-sm font-extrabold tracking-tight leading-tight ${
              isLight ? 'text-white' : 'text-[#0B2C5F]'
            }`}
          >
            SI-LUSSI
          </div>
          <p
            className={`text-[11px] font-medium truncate mt-0.5 ${
              isLight ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            DPUPR Provinsi Jawa Tengah
          </p>
        </div>
      )}
    </div>
  );
};
