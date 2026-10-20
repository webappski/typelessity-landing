#!/usr/bin/perl
# The check of seo-lead-typelessity-redesign.md §6 (the column «Don't write») over files of the build, as a script.
#   perl scripts/forbidden-phrases.pl $(find dist/typelessity-landing/browser \( -name '*.html' -o -name '*.txt' \) ! -name 3rdpartylicenses.txt)
# Cuts the allowed forms (the column «Write instead»), then looks for the forbidden phrases, prints «file: …[phrase]…» for each and, last, the count.
# perl and not BSD grep: grep over one-line prerendered HTML did not finish in 2 minutes (L10 point A, 20.10).
# The dictionary the test suite enforces is e2e/claims-dictionary.ts; this is the raw §6 column read over the same bytes — a second pair of eyes
# that does not share the dictionary's classes. A new allowed form needs a decision of the director, and a line below saying where it lives.
use strict;
use warnings;

my $BAD = qr/in 25 languages|replies in the customer|detects the language|under the labels you chose|labelled details|your own language|most chosen|most popular|trusted by|data in the EU|hosted in the EU|EU-only|never leaves Europe|GDPR[- ]compliant|DSGVO-konform|zgodny z RODO|before anything happens|before any AI processing|works on any site|works with (?:WordPress|Wix|Squarespace|React|Vue)|checks your booking system|booking confirmed|confirmed booking|books the appointment for you|integrates with|connects to|AI receptionist|answers calls|WhatsApp|\bSMS\b|voice AI|talks back|just as well on phones|mobile-optimized|in \d+ minutes|saves \d+ hours|fewer no-shows|webhook|free forever|unlimited|recommended by ChatGPT|AI recommends us|\bSLA\b|99\.9 ?% uptime|HIPAA|for clinics|Zero Data Retention|Mock note|Portal screenshot goes here|Thin template|the server answers 404|widget-states|25\+/i;

# The allowed forms, one per line, with the place each lives in.
my @OK = (
  'chat window (?:that )?(?:comes )?in 25 languages',                        # /, /about, /faq, /for-ai-agents, /pricing, five blog posts, llms*.txt (checked 20.10 on the old build)
  'certified-for-us-healthcare-hipaa',                                        # /faq (an anchor id of the answer about HIPAA)
  'test your own languages',                                                  # the beauty-salons comparison post (blog)
  'No availability SLA in the standard terms yet',                            # /pricing, four blog posts, llms.txt, llms-full.txt
  'unlimited sites',                                                          # /pricing, four blog posts, llms*.txt (the Enterprise tier)
  'not HIPAA-attested',                                                       # llms.txt, llms-full.txt
  'no HIPAA attestation',                                                     # /faq
  'certified for US healthcare \(HIPAA\)',                                    # /faq (the visitor's question, answered with a no)
  'Is (?:Typelessity|it) an AI receptionist\?',                               # /faq and /industries/beauty-hair-salons (the visitor's question; FL-31/39: confirm at the judges' round)
  'does not answer calls, WhatsApp or SMS',                                   # /faq
  'connects to any booking system with an API',                               # llms.txt
  'checks your booking system for what is free, if it has an API',            # / (the home page)
);
my $OK = join '|', @OK;
$OK = qr/$OK/i;

my $left = 0;
for my $file (@ARGV) {
  open my $fh, '<:encoding(UTF-8)', $file or die "$file: $!\n";
  local $/;
  my $text = <$fh>;
  close $fh;
  $text =~ s/$OK/ /g;
  while ($text =~ /$BAD/g) {
    my ($from, $to) = ($-[0], $+[0]);
    my $before = substr($text, $from > 30 ? $from - 30 : 0, $from > 30 ? 30 : $from);
    my $after = substr($text, $to, 30);
    for ($before, $after) { s/\s+/ /g }
    my $hit = substr($text, $from, $to - $from);
    print "$file: …$before\[$hit]$after…\n";
    $left++;
  }
}
print "forbidden phrases left after the allowed forms: $left\n";
exit($left ? 1 : 0);
