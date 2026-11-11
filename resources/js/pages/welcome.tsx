import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import usinImage from '@/../images/usin.png';
import backgroundImage from '@/../images/background.jpg';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Культура и живопись Китая">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div
                className="flex min-h-screen flex-col items-center p-6 text-[#1b1b18] lg:justify-center lg:p-8"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                }}
            >
                {/* Шапка с навигацией */}
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-between gap-4">
                        <span className="font-medium tracking-wide text-[#706f6c] dark:text-[#A1A09A]">
                            Искусство Поднебесной
                        </span>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Настройки
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                    >
                                        Войти
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Регистрация
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        {/* Левая часть — текстовый блок */}
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 text-[13px] leading-[20px] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-[#161615] dark:text-[#EDEDEC] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
                            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#f53003] dark:text-[#FF4433]">
                                Проект · Гохуа · У-син
                            </p>
                            <h1 className="mb-3 text-2xl font-medium leading-tight lg:text-3xl">
                                Культура и живопись Китая
                            </h1>
                            <p className="mb-2 text-[#706f6c] dark:text-[#A1A09A]">
                                Китайская живопись — не только искусство, но и способ
                                понимания мира. Она связана с философией даосизма,
                                конфуцианства и буддизма, где важны гармония,
                                естественность и единство человека с природой.
                            </p>
                            <p className="mb-4 text-[#706f6c] dark:text-[#A1A09A]">
                                Наш проект превращает личный опыт освоения техник
                                <span className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">
                                    {' '}Гохуа{' '}
                                </span>
                                и
                                <span className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">
                                    {' '}У-син{' '}
                                </span>
                                в образовательный ресурс: методическое пособие
                                «Тайны китайской кисти» и интерактивную игру для
                                проверки знаний.
                            </p>

                            <h2 className="mb-1 font-medium">Пять элементов У-син</h2>
                            <p className="mb-2 text-[#706f6c] dark:text-[#A1A09A]">
                                Каждый элемент задаёт свой тип движения, ритм и
                                характер мазка.
                            </p>
                            <ul className="mb-4 flex flex-col lg:mb-6">
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#2f7d32] dark:bg-[#4caf50]" />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-medium">Дерево</span> —
                                        прямые линии с опорой на плечо; символ роста.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#e64a19] dark:bg-[#ff7043]" />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-medium">Огонь</span> —
                                        лёгкие движения запястьем; форма капли или
                                        лепестка.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#8d6e63] dark:bg-[#a1887f]" />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-medium">Земля</span> —
                                        точечный отпечаток кисти; стабильность и
                                        структура.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-1/2 before:bottom-0 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#78909c] dark:bg-[#90a4ae]" />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-medium">Металл</span> —
                                        вытянутые мазки с постепенным нажимом;
                                        утончённость.
                                    </span>
                                </li>
                                <li className="relative flex items-center gap-4 py-2 before:absolute before:top-0 before:bottom-1/2 before:left-[0.4rem] before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A]">
                                    <span className="relative bg-white py-1 dark:bg-[#161615]">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#e3e3e0] bg-[#FDFDFC] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] dark:border-[#3E3E3A] dark:bg-[#161615]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#1976d2] dark:bg-[#42a5f5]" />
                                        </span>
                                    </span>
                                    <span>
                                        <span className="font-medium">Вода</span> —
                                        вращательные движения пальцами;
                                        струящиеся формы.
                                    </span>
                                </li>
                            </ul>

                            <h2 className="mb-1 font-medium">Что внутри проекта</h2>
                            <ul className="mb-4 flex flex-col gap-1 text-[#706f6c] dark:text-[#A1A09A]">
                                <li>— методическое пособие «Тайны китайской кисти»;</li>
                                <li>— интерактивная игра «Культура и живопись Китая»;</li>
                                <li>— мастер-классы и выставки для разных возрастов.</li>
                            </ul>

                            <ul className="flex flex-wrap gap-3 text-sm leading-normal">
                                <li>
                                    <a
                                        href="/downloads/tajny-kitayskoy-kisti.pdf"
                                        download
                                        className="inline-block rounded-sm border border-black bg-[#1b1b18] px-5 py-1.5 text-sm leading-normal text-white hover:border-black hover:bg-black dark:border-[#eeeeec] dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:border-white dark:hover:bg-white"
                                    >
                                        Методическое пособие
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/game/"
                                        target="_blank"
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Играть в игру
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Правая часть — визуальный блок */}
                        <div className="relative -mb-px flex aspect-[335/376] w-full shrink-0 items-center justify-center overflow-hidden rounded-t-lg bg-[#fff2f2] p-6 lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg lg:p-10 dark:bg-[#1D0002]">

                            {/* Изображение У-син */}
                            <img
                                src={usinImage}
                                alt="Пять элементов У-син: дерево, огонь, земля, металл, вода"
                                className="h-full w-full object-contain"
                                loading="lazy"
                            />

                            <div className="pointer-events-none absolute inset-0 rounded-t-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] lg:rounded-t-none lg:rounded-r-lg dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]" />
                        </div>
                    </main>
                </div>
                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}