import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Guide des tailles' };

export default function GuideDesTaillesPage() {
  return (
    <LegalLayout
      title="Guide des tailles"
      intro="Pour choisir la taille idéale, comparez vos mensurations (en centimètres) aux tableaux ci-dessous. En cas de doute entre deux tailles, nous vous conseillons de privilégier la plus grande."
    >
      <h2>Femme — Vêtements</h2>
      <table>
        <thead>
          <tr>
            <th>Taille</th>
            <th>Poitrine (cm)</th>
            <th>Taille (cm)</th>
            <th>Hanches (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>XS (34)</td>
            <td>78–82</td>
            <td>60–64</td>
            <td>86–90</td>
          </tr>
          <tr>
            <td>S (36)</td>
            <td>82–86</td>
            <td>64–68</td>
            <td>90–94</td>
          </tr>
          <tr>
            <td>M (38)</td>
            <td>86–90</td>
            <td>68–72</td>
            <td>94–98</td>
          </tr>
          <tr>
            <td>L (40)</td>
            <td>90–94</td>
            <td>72–76</td>
            <td>98–102</td>
          </tr>
          <tr>
            <td>XL (42)</td>
            <td>94–98</td>
            <td>76–80</td>
            <td>102–106</td>
          </tr>
        </tbody>
      </table>

      <h2>Homme — Vêtements</h2>
      <table>
        <thead>
          <tr>
            <th>Taille</th>
            <th>Poitrine (cm)</th>
            <th>Tour de taille (cm)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>S</td>
            <td>88–94</td>
            <td>76–82</td>
          </tr>
          <tr>
            <td>M</td>
            <td>94–100</td>
            <td>82–88</td>
          </tr>
          <tr>
            <td>L</td>
            <td>100–106</td>
            <td>88–94</td>
          </tr>
          <tr>
            <td>XL</td>
            <td>106–112</td>
            <td>94–100</td>
          </tr>
        </tbody>
      </table>

      <h2>Comment prendre vos mesures</h2>
      <ul>
        <li>
          <strong>Poitrine</strong> : mesurez horizontalement à l&apos;endroit le plus fort, sous
          les bras.
        </li>
        <li>
          <strong>Taille</strong> : mesurez au creux de la taille, partie la plus étroite du buste.
        </li>
        <li>
          <strong>Hanches</strong> : mesurez à l&apos;endroit le plus fort, debout, pieds joints.
        </li>
      </ul>

      <h2>Un doute&nbsp;?</h2>
      <p>
        Notre équipe se tient à votre disposition pour vous conseiller. Contactez-nous depuis la page{' '}
        Contact, nous vous répondrons avec plaisir.
      </p>
    </LegalLayout>
  );
}
