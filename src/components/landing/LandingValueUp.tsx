'use client';

import { ArrowUpRight, BarChart3, CircleCheckBig, ShieldCheck } from 'lucide-react';

const VALUE_POINTS = [
  {
    title: 'Fast Matching',
    description: 'Search once and retrieve core registry and market signals in a single flow.',
    icon: ArrowUpRight,
  },
  {
    title: 'Accurate Area Basis',
    description: 'Combine exclusive and shared area values to produce reliable contract-area metrics.',
    icon: BarChart3,
  },
  {
    title: 'Verifiable Inputs',
    description: 'Keep assumptions and source fields clear for reproducible quote review.',
    icon: ShieldCheck,
  },
  {
    title: 'Report-Ready Output',
    description: 'Convert selected scenarios into shareable estimates and decision-ready summaries.',
    icon: CircleCheckBig,
  },
];

export function LandingValueUp() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Value Lift</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            From Raw Data to Decision-Ready View
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            The process is simplified into a single path: intake, validate, compare, and generate output.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {VALUE_POINTS.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-sm"
            >
              <div className="mb-3 inline-flex rounded-xl bg-blue-600/10 p-2 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
