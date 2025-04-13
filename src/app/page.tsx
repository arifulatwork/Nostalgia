import Head from 'next/head';
import TVNostalgia from './components/TV/TVNostalgia';

export default function Home() {
  return (
    <>
      <Head>
        <title>90s TV Nostalgia</title>
        <link href="https://fonts.googleapis.com/css?family=Medula+One" rel="stylesheet" />
      </Head>
      <TVNostalgia />
    </>
  );
}